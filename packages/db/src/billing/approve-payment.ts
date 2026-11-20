import { and, eq } from "drizzle-orm";

import { splitPayment } from "@telehealth/domain";

import type { Db } from "../client";
import { payments } from "../schema";
import { loadActiveCommissionRule } from "./commission-rules";

export async function approvePaymentWithCommission(
  db: Db,
  paymentId: string,
  countryId: string | null,
  countryCode: string | undefined,
): Promise<void> {
  const rule = await loadActiveCommissionRule(db, countryId, countryCode);
  if (!rule) {
    throw new Error("No hay regla de comisión activa.");
  }

  const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId));
  if (!payment) throw new Error("Pago no encontrado.");
  if (payment.status === "approved" && payment.commissionCents !== null) {
    return;
  }

  const split = splitPayment(payment.amountCents, rule);
  const now = new Date();

  await db
    .update(payments)
    .set({
      status: "approved",
      commissionRuleId: split.commissionRuleId,
      commissionRuleVersion: split.commissionRuleVersion,
      commissionCents: split.commissionCents,
      netCents: split.netCents,
      countryId: countryId ?? payment.countryId,
      approvedAt: now,
    })
    .where(and(eq(payments.id, paymentId), eq(payments.status, "pending")));
}
