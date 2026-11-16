import { and, desc, eq, isNull } from "drizzle-orm";

import { createDb } from "@telehealth/db";
import { assessmentSessions, consents, patientProfiles } from "@telehealth/db/schema";

import { ConsentForm } from "./consent-form";
import { auth } from "@/auth/auth";
import { getServerEnv } from "@/env.server";
import { getPublicProfessionalById } from "@/server/professionals/list";

export default async function ProfesionalConsentimientoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;

  if (!session?.user?.id || !url) {
    return <p className="p-4 text-sm">Debes iniciar sesión como paciente.</p>;
  }

  const db = createDb(url);
  const pro = await getPublicProfessionalById(db, id);

  const [profile] = await db
    .select()
    .from(patientProfiles)
    .where(eq(patientProfiles.userId, session.user.id));

  const [completed] = profile
    ? await db
        .select()
        .from(assessmentSessions)
        .where(
          and(
            eq(assessmentSessions.patientProfileId, profile.id),
            eq(assessmentSessions.status, "completed"),
          ),
        )
        .orderBy(desc(assessmentSessions.updatedAt))
        .limit(1)
    : [];

  const intakeId = completed?.intakeFormId;
  if (!pro) {
    return <p className="p-4 text-sm">Este profesional no está disponible en el directorio.</p>;
  }
  if (!intakeId) {
    return <p className="p-4 text-sm">Completa la autoevaluación antes de elegir un profesional.</p>;
  }

  const [existing] = await db
    .select()
    .from(consents)
    .where(
      and(eq(consents.intakeFormId, intakeId), eq(consents.professionalProfileId, pro.id), isNull(consents.revokedAt)),
    );

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-10">
      <h1 className="text-2xl font-semibold text-calm-900">Compartir ficha con {pro.displayName}</h1>
      <ConsentForm
        professionalId={pro.id}
        intakeFormId={intakeId}
        alreadyGranted={Boolean(existing)}
      />
    </main>
  );
}