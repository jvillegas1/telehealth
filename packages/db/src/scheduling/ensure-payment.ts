import { eq } from "drizzle-orm";

import type { Db } from "../client";
import { payments } from "../schema";

export type EnsurePaymentInput = {
  appointmentId: string;
  amountCents: number;
  currency: string;
  sandboxAutoApprove: boolean;
};

export async function ensureAppointmentPayment(db: Db, input: EnsurePaymentInput) {
  const [existing] = await db
    .select()
    .from(payments)
    .where(eq(payments.appointmentId, input.appointmentId));
  if (existing) return existing;

  const status = input.sandboxAutoApprove ? ("approved" as const) : ("pending" as const);
  const [created] = await db
    .insert(payments)
    .values({
      appointmentId: input.appointmentId,
      amountCents: input.amountCents,
      currency: input.currency,
      status,
    })
    .returning();
  return created!;
}
