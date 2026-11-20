import { and, eq } from "drizzle-orm";

import type { Db } from "@telehealth/db";
import {
  appointments,
  patientProfiles,
  payments,
  professionalProfiles,
  therapySessions,
} from "@telehealth/db/schema";

export type SessionParticipantRole = "patient" | "professional";

export async function loadSessionAppointment(
  db: Db,
  appointmentId: string,
  userId: string,
  userRole: string,
) {
  const [row] = await db
    .select({
      appointment: appointments,
      paymentStatus: payments.status,
      therapySession: therapySessions,
      professionalName: professionalProfiles.displayName,
      professionalUserId: professionalProfiles.userId,
      patientUserId: patientProfiles.userId,
    })
    .from(appointments)
    .leftJoin(payments, eq(payments.appointmentId, appointments.id))
    .leftJoin(therapySessions, eq(therapySessions.appointmentId, appointments.id))
    .innerJoin(patientProfiles, eq(patientProfiles.id, appointments.patientProfileId))
    .innerJoin(
      professionalProfiles,
      eq(professionalProfiles.id, appointments.professionalProfileId),
    )
    .where(eq(appointments.id, appointmentId));

  if (!row) return null;

  let participant: SessionParticipantRole | null = null;
  if (userRole === "patient" && row.patientUserId === userId) {
    participant = "patient";
  } else if (userRole === "professional" && row.professionalUserId === userId) {
    participant = "professional";
  } else if (userRole === "admin") {
    participant = "professional";
  }

  if (!participant) return null;

  return { ...row, participant };
}

export async function loadPatientIntakeConsent(
  db: Db,
  params: { patientProfileId: string; professionalProfileId: string },
) {
  const { consents } = await import("@telehealth/db/schema");
  const { isNull } = await import("drizzle-orm");
  const [row] = await db
    .select()
    .from(consents)
    .where(
      and(
        eq(consents.patientProfileId, params.patientProfileId),
        eq(consents.professionalProfileId, params.professionalProfileId),
        eq(consents.scope, "intake_form_share"),
        isNull(consents.revokedAt),
      ),
    );
  return row ?? null;
}
