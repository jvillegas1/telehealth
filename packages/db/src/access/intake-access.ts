import { and, eq, isNull } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { decryptField } from "../crypto/field-encryption";
import * as schema from "../schema";
import { auditLog, consents, intakeForms, patientProfiles, professionalProfiles } from "../schema";

export type IntakeAccessResult =
  | { ok: true; content: string }
  | { ok: false; status: 403 | 404; message: string };

export async function readIntakeFormForActor(
  db: NodePgDatabase<typeof schema>,
  params: {
    intakeFormId: string;
    actorUserId: string;
    actorRole: "patient" | "professional" | "admin";
    encryptionKey: string;
  },
): Promise<IntakeAccessResult> {
  const [form] = await db.select().from(intakeForms).where(eq(intakeForms.id, params.intakeFormId));

  if (!form) {
    return { ok: false, status: 404, message: "No encontramos esa ficha." };
  }

  if (params.actorRole === "patient") {
    const [profile] = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.userId, params.actorUserId));
    if (!profile || profile.id !== form.patientProfileId) {
      return { ok: false, status: 403, message: "No tienes permiso para ver esta ficha." };
    }
  }

  if (params.actorRole === "professional") {
    const [pro] = await db
      .select()
      .from(professionalProfiles)
      .where(eq(professionalProfiles.userId, params.actorUserId));
    if (!pro) {
      return { ok: false, status: 403, message: "No tienes permiso para ver esta ficha." };
    }
    const [activeConsent] = await db
      .select()
      .from(consents)
      .where(
        and(
          eq(consents.intakeFormId, form.id),
          eq(consents.professionalProfileId, pro.id),
          isNull(consents.revokedAt),
        ),
      );
    if (!activeConsent) {
      return { ok: false, status: 403, message: "Necesitas consentimiento del paciente para esta ficha." };
    }
  }

  await db.insert(auditLog).values({
    actorUserId: params.actorUserId,
    action: "intake_form_read",
    resourceType: "intake_form",
    resourceId: form.id,
    metadata: { role: params.actorRole },
  });

  const content = decryptField(
    {
      ciphertext: form.contentCiphertext,
      iv: form.contentIv,
      tag: form.contentTag,
    },
    params.encryptionKey,
  );

  return { ok: true, content };
}