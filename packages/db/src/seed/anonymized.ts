import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";

import { encryptField } from "../crypto/field-encryption";
import type { Db } from "../client";
import {
  availability,
  cancellationPolicies,
  commissionRules,
  consents,
  countries,
  credentials,
  professionalAvailabilityRules,
  crisisResources,
  intakeForms,
  patientProfiles,
  professionalProfiles,
  users,
} from "../schema";
import { DEMO_PASSWORD } from "./demo-credentials";
import { ensureAdminUser } from "./ensure-admin";

export async function seedAnonymized(db: Db, encryptionKey: string): Promise<void> {
  let [country] = await db.select().from(countries).where(eq(countries.code, "AR"));
  if (!country) {
    [country] = await db
      .insert(countries)
      .values({ code: "AR", name: "Argentina (demo)", currency: "ARS", locale: "es" })
      .returning();
  }
  if (!country) {
    throw new Error("No se pudo crear el país demo.");
  }
  const countryId = country.id;

  const [existingRule] = await db
    .select()
    .from(commissionRules)
    .where(eq(commissionRules.countryId, countryId))
    .limit(1);
  if (!existingRule) {
    await db.insert(commissionRules).values({
      countryId,
      version: 1,
      rateBps: 1500,
      summary: "Comisión plataforma 15% (demo AR).",
      active: true,
    });
  }

  const passwordHash = await hash(DEMO_PASSWORD);

  const [patientUser] = await db
    .insert(users)
    .values({
      email: "paciente.a@example.test",
      name: "Paciente Demo A",
      role: "patient",
      passwordHash,
      countryId,
      privacySettings: { shareAnalytics: false },
    })
    .returning();

  const [patientUserB] = await db
    .insert(users)
    .values({
      email: "paciente.b@example.test",
      name: "Paciente Demo B",
      role: "patient",
      passwordHash,
      countryId,
      privacySettings: { shareAnalytics: false },
    })
    .returning();

  const [proUser] = await db
    .insert(users)
    .values({
      email: "profesional@example.test",
      name: "Profesional Demo",
      role: "professional",
      passwordHash,
      countryId,
      mfaEnabled: false,
    })
    .returning();

  const [patientA] = await db
    .insert(patientProfiles)
    .values({ userId: patientUser!.id, displayName: "Paciente A" })
    .returning();

  await db.insert(patientProfiles).values({ userId: patientUserB!.id, displayName: "Paciente B" });

  const [proProfile] = await db
    .insert(professionalProfiles)
    .values({
      userId: proUser!.id,
      displayName: "Profesional Demo",
      bio: "Acompañamiento orientativo con enfoque contextual.",
      countryId,
      specialties: ["psicologia-clinica", "acompanamiento-emocional"],
      therapeuticApproach: "Integrativo",
      languages: ["es"],
      feeCents: 800_000,
      currency: "ARS",
      photoAlt: "Retrato del profesional demo",
      status: "approved",
      publishedAt: new Date(),
    })
    .returning();

  await db.insert(credentials).values({
    professionalProfileId: proProfile!.id,
    licenseNumber: "MP-DEMO-001",
    issuingBody: "Colegio de Psicólogos (demo)",
    status: "verified",
    verifiedAt: new Date(),
  });

  await db.insert(cancellationPolicies).values({
    countryId,
    version: 1,
    minCancelHours: 24,
    minRescheduleHours: 24,
    summary:
      "Podés cancelar o reprogramar hasta 24 horas antes del inicio. Pasado ese plazo, escribí al profesional desde la plataforma.",
    active: true,
  });

  await db.insert(professionalAvailabilityRules).values([
    {
      professionalProfileId: proProfile!.id,
      dayOfWeek: 1,
      startTime: "09:00:00",
      endTime: "13:00:00",
      slotMinutes: 50,
      bufferMinutes: 10,
    },
    {
      professionalProfileId: proProfile!.id,
      dayOfWeek: 3,
      startTime: "14:00:00",
      endTime: "18:00:00",
      slotMinutes: 50,
      bufferMinutes: 10,
    },
  ]);

  const slotStart = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
  await db.insert(availability).values({
    professionalProfileId: proProfile!.id,
    startsAt: slotStart,
    endsAt: slotEnd,
  });

  const [pendingProUser] = await db
    .insert(users)
    .values({
      email: "profesional.pendiente@example.test",
      name: "Profesional Pendiente",
      role: "professional",
      passwordHash,
      countryId,
    })
    .returning();

  const [pendingProfile] = await db
    .insert(professionalProfiles)
    .values({
      userId: pendingProUser!.id,
      displayName: "Perfil en revisión",
      countryId,
      specialties: ["duelo"],
      languages: ["es"],
      status: "pending_review",
    })
    .returning();

  await db.insert(credentials).values({
    professionalProfileId: pendingProfile!.id,
    licenseNumber: "MP-PENDING",
    issuingBody: "Colegio (demo)",
    status: "pending",
  });

  const enc = encryptField(
    JSON.stringify({ orientativo: true, nota: "Resultado orientativo, no diagnóstico." }),
    encryptionKey,
  );

  const [intake] = await db
    .insert(intakeForms)
    .values({
      patientProfileId: patientA!.id,
      contentCiphertext: enc.ciphertext,
      contentIv: enc.iv,
      contentTag: enc.tag,
    })
    .returning();

  await db.insert(consents).values({
    patientProfileId: patientA!.id,
    intakeFormId: intake!.id,
    professionalProfileId: proProfile!.id,
    scope: "intake_form_share",
  });

  const admin = await ensureAdminUser(db, encryptionKey);

  await db.insert(crisisResources).values({
    countryId,
    title: "Línea de contención (demo)",
    description: "Recurso de prueba verificable por administración.",
    resourceType: "url",
    contactUri: "https://example.test/crisis-demo",
    active: true,
    verifiedAt: new Date(),
    verifiedByUserId: admin.userId,
    sortOrder: 1,
  });

  void admin;

  return void 0;
}

export { DEMO_PASSWORD };
