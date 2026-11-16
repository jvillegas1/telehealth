import { and, desc, eq, isNotNull } from "drizzle-orm";

import {
  ASSESSMENT_PROMPT_VERSION,
  AssessmentStep,
  evaluateUserMessage,
  nextStep,
  stepAnswerSchema,
  type StepAnswers,
} from "@telehealth/domain";
import { createDb, decryptProgress, encryptProgress } from "@telehealth/db";
import {
  assessmentSessions,
  crisisResources,
  intakeForms,
  patientProfiles,
  users,
} from "@telehealth/db/schema";
import { generateAssessmentOutput } from "./claude";

export function getDbOrThrow(databaseUrl: string | undefined) {
  if (!databaseUrl) throw new Error("NO_DATABASE");
  return createDb(databaseUrl);
}

export async function createOrResumeSession(params: {
  databaseUrl: string;
  userId: string;
  encryptionKey: string;
}) {
  const db = getDbOrThrow(params.databaseUrl);
  const [profile] = await db
    .select()
    .from(patientProfiles)
    .where(eq(patientProfiles.userId, params.userId));
  if (!profile) throw new Error("NO_PROFILE");

  const [user] = await db.select().from(users).where(eq(users.id, params.userId));
  if (!user?.countryId) throw new Error("NO_COUNTRY");

  const [existing] = await db
    .select()
    .from(assessmentSessions)
    .where(
      and(
        eq(assessmentSessions.patientProfileId, profile.id),
        eq(assessmentSessions.status, "in_progress"),
      ),
    )
    .orderBy(desc(assessmentSessions.updatedAt))
    .limit(1);

  if (existing) {
    return { sessionId: existing.id, resumed: true, currentStep: existing.currentStep };
  }

  const [created] = await db
    .insert(assessmentSessions)
    .values({
      patientProfileId: profile.id,
      countryId: user.countryId,
      promptVersion: ASSESSMENT_PROMPT_VERSION,
      currentStep: AssessmentStep.Welcome,
    })
    .returning();

  return {
    sessionId: created!.id,
    resumed: false,
    currentStep: created!.currentStep,
  };
}

export async function submitStep(params: {
  databaseUrl: string;
  encryptionKey: string;
  sessionId: string;
  userId: string;
  step: string;
  answer: string;
}) {
  const parsed = stepAnswerSchema.safeParse({ step: params.step, answer: params.answer });
  if (!parsed.success) {
    return { ok: false as const, status: 400, message: "Revisa tu respuesta." };
  }

  const risk = evaluateUserMessage(parsed.data.answer);
  if (risk.triggered) {
    const db = getDbOrThrow(params.databaseUrl);
    await db
      .update(assessmentSessions)
      .set({ status: "risk_halted", riskTriggeredAt: new Date(), updatedAt: new Date() })
      .where(eq(assessmentSessions.id, params.sessionId));
    const resources = await getCrisisResources(params.databaseUrl, params.userId);
    return { ok: false as const, status: 200, risk: true as const, resources };
  }

  const db = getDbOrThrow(params.databaseUrl);
  const [session] = await db
    .select()
    .from(assessmentSessions)
    .where(eq(assessmentSessions.id, params.sessionId));
  if (!session || session.status !== "in_progress") {
    return { ok: false as const, status: 404, message: "Sesión no disponible." };
  }

  const prior: StepAnswers =
    session.progressCiphertext && session.progressIv && session.progressTag
      ? decryptProgress(
          {
            ciphertext: session.progressCiphertext,
            iv: session.progressIv,
            tag: session.progressTag,
          },
          params.encryptionKey,
        )
      : {};

  prior[parsed.data.step] = parsed.data.answer;
  const enc = encryptProgress(prior, params.encryptionKey);
  const following = nextStep(parsed.data.step) ?? AssessmentStep.Closure;

  await db
    .update(assessmentSessions)
    .set({
      progressCiphertext: enc.ciphertext,
      progressIv: enc.iv,
      progressTag: enc.tag,
      currentStep: following,
      updatedAt: new Date(),
    })
    .where(eq(assessmentSessions.id, params.sessionId));

  return { ok: true as const, nextStep: following };
}

export async function finalizeSession(params: {
  databaseUrl: string;
  encryptionKey: string;
  sessionId: string;
  anthropicKey?: string;
  anthropicModel?: string;
}) {
  const db = getDbOrThrow(params.databaseUrl);
  const [session] = await db
    .select()
    .from(assessmentSessions)
    .where(eq(assessmentSessions.id, params.sessionId));
  if (!session || session.status !== "in_progress") {
    return { ok: false as const, status: 404, message: "Sesión no disponible." };
  }

  const answers =
    session.progressCiphertext && session.progressIv && session.progressTag
      ? decryptProgress(
          {
            ciphertext: session.progressCiphertext,
            iv: session.progressIv,
            tag: session.progressTag,
          },
          params.encryptionKey,
        )
      : {};

  try {
    const output = await generateAssessmentOutput({
      answers: answers as Record<string, string>,
      mock: !params.anthropicKey,
      ...(params.anthropicKey ? { apiKey: params.anthropicKey } : {}),
      ...(params.anthropicModel ? { model: params.anthropicModel } : {}),
    });
    const { encryptField } = await import("@telehealth/db");
    const content = encryptField(JSON.stringify(output), params.encryptionKey);
    const summary = encryptField(output.resumen, params.encryptionKey);

    const [intake] = await db
      .insert(intakeForms)
      .values({
        patientProfileId: session.patientProfileId,
        contentCiphertext: content.ciphertext,
        contentIv: content.iv,
        contentTag: content.tag,
        summaryCiphertext: summary.ciphertext,
        summaryIv: summary.iv,
        summaryTag: summary.tag,
      })
      .returning();

    await db
      .update(assessmentSessions)
      .set({
        status: "completed",
        intakeFormId: intake!.id,
        currentStep: AssessmentStep.Closure,
        updatedAt: new Date(),
      })
      .where(eq(assessmentSessions.id, params.sessionId));

    return { ok: true as const, intakeFormId: intake!.id, output };
  } catch {
    await db
      .update(assessmentSessions)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(assessmentSessions.id, params.sessionId));
    return { ok: false as const, status: 503, message: "No pudimos generar el resumen. Tu progreso quedó guardado." };
  }
}

export async function getCrisisResources(databaseUrl: string, userId: string) {
  const db = getDbOrThrow(databaseUrl);
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user?.countryId) return [];
  return db
    .select()
    .from(crisisResources)
    .where(
      and(
        eq(crisisResources.countryId, user.countryId),
        eq(crisisResources.active, true),
        isNotNull(crisisResources.verifiedAt),
      ),
    )
    .orderBy(crisisResources.sortOrder);
}