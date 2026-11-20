import { and, eq } from "drizzle-orm";

import type { Db } from "../client";
import { appointments, payments, professionalProfiles } from "../schema";
import { approvePaymentWithCommission } from "./approve-payment";

export async function acceptProfessionalAppointment(
  db: Db,
  appointmentId: string,
  professionalProfileId: string,
  sandboxAutoApprove: boolean,
): Promise<void> {
  const [apt] = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.id, appointmentId),
        eq(appointments.professionalProfileId, professionalProfileId),
        eq(appointments.status, "pending"),
      ),
    );
  if (!apt) throw new Error("Cita no encontrada o no pendiente.");

  const [pro] = await db
    .select()
    .from(professionalProfiles)
    .where(eq(professionalProfiles.id, professionalProfileId));

  await db
    .update(appointments)
    .set({ status: "confirmed", updatedAt: new Date() })
    .where(eq(appointments.id, appointmentId));

  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.appointmentId, appointmentId));

  if (payment && sandboxAutoApprove) {
    await approvePaymentWithCommission(db, payment.id, pro?.countryId ?? null, undefined);
  }
}

export async function rejectProfessionalAppointment(
  db: Db,
  appointmentId: string,
  professionalProfileId: string,
): Promise<void> {
  await db
    .update(appointments)
    .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(appointments.id, appointmentId),
        eq(appointments.professionalProfileId, professionalProfileId),
        eq(appointments.status, "pending"),
      ),
    );

  await db
    .update(payments)
    .set({ status: "rejected" })
    .where(and(eq(payments.appointmentId, appointmentId), eq(payments.status, "pending")));
}
