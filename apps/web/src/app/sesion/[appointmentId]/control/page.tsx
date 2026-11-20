import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { createDb } from "@telehealth/db";
import { appointments, patientProfiles, users } from "@telehealth/db/schema";

import { auth } from "@/auth/auth";
import { ProfessionalControlClient } from "@/components/session/professional-control-client";
import { getServerEnv } from "@/env.server";
import { loadPatientIntakeConsent } from "@/server/session/appointment-access";

export default async function SessionControlPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/ingreso");
  if (session.user.role !== "professional") redirect("/citas");

  const { appointmentId } = await params;
  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) return <p className="p-4 text-sm">Servicio no disponible.</p>;

  const db = createDb(url);
  const [row] = await db
    .select({
      appointment: appointments,
      patientUserId: patientProfiles.userId,
    })
    .from(appointments)
    .innerJoin(patientProfiles, eq(patientProfiles.id, appointments.patientProfileId))
    .where(eq(appointments.id, appointmentId));

  if (!row) return <p className="p-4 text-sm">Cita no encontrada.</p>;

  const [patientUser] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, row.patientUserId));

  const consent = await loadPatientIntakeConsent(db, {
    patientProfileId: row.appointment.patientProfileId,
    professionalProfileId: row.appointment.professionalProfileId,
  });

  const label = patientUser?.name ?? patientUser?.email ?? "Paciente";

  return (
    <ProfessionalControlClient
      appointmentId={appointmentId}
      patientLabel={label}
      hasIntakeConsent={consent !== null}
      sessionHref={`/sesion/${appointmentId}`}
    />
  );
}
