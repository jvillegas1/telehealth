import { and, eq, inArray } from "drizzle-orm";

import type { Db } from "../client";
import { appointments } from "../schema";
import { ScheduleConflictError, isPgUniqueViolation } from "./errors";

export type BookAppointmentInput = {
  patientProfileId: string;
  professionalProfileId: string;
  scheduledAt: Date;
  scheduledEndAt: Date;
  cancellationPolicyVersion: number;
  policyAcceptedAt: Date;
  rescheduledFromId?: string;
};

export async function bookAppointment(db: Db, input: BookAppointmentInput) {
  try {
    const [row] = await db
      .insert(appointments)
      .values({
        patientProfileId: input.patientProfileId,
        professionalProfileId: input.professionalProfileId,
        scheduledAt: input.scheduledAt,
        scheduledEndAt: input.scheduledEndAt,
        status: "confirmed",
        cancellationPolicyVersion: input.cancellationPolicyVersion,
        policyAcceptedAt: input.policyAcceptedAt,
        ...(input.rescheduledFromId ? { rescheduledFromId: input.rescheduledFromId } : {}),
      })
      .returning();
    return row!;
  } catch (error) {
    if (isPgUniqueViolation(error)) {
      throw new ScheduleConflictError();
    }
    throw error;
  }
}

export async function cancelAppointment(
  db: Db,
  appointmentId: string,
  patientProfileId: string,
): Promise<void> {
  await db
    .update(appointments)
    .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(appointments.id, appointmentId),
        eq(appointments.patientProfileId, patientProfileId),
        inArray(appointments.status, ["pending", "confirmed"]),
      ),
    );
}

export async function loadBusyIntervals(
  db: Db,
  professionalProfileId: string,
): Promise<{ start: Date; end: Date }[]> {
  const rows = await db
    .select({
      scheduledAt: appointments.scheduledAt,
      scheduledEndAt: appointments.scheduledEndAt,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.professionalProfileId, professionalProfileId),
        inArray(appointments.status, ["pending", "confirmed"]),
      ),
    );
  return rows.map((r) => ({ start: r.scheduledAt, end: r.scheduledEndAt }));
}
