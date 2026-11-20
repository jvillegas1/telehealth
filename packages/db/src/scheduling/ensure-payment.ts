import { eq } from "drizzle-orm";

import type { Db } from "../client";
import { payments } from "../schema";

export type EnsurePaymentInput = {
  appointmentId: string;
  amountCents: number;
  currency: string;
};

export async function ensureAppointmentPayment(db: Db, input: EnsurePaymentInput) {
  const [existing] = await db
    .select()
    .from(payments)
    .where(eq(payments.appointmentId, input.appointmentId));
  if (existing) return existing;

  const [created] = await db
    .insert(payments)
    .values({
      appointmentId: input.appointmentId,
      amountCents: input.amountCents,
      currency: input.currency,
      status: "pending",
    })
    .returning();
  return created!;
}
