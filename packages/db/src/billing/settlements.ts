import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";

import type { Db } from "../client";
import { payments, settlementBatches, settlementItems } from "../schema";

export type RunSettlementsInput = {
  periodStart: Date;
  periodEnd: Date;
  mockPay: boolean;
};

export async function runSettlementJob(db: Db, input: RunSettlementsInput): Promise<number> {
  const assigned = db
    .select({ paymentId: settlementItems.paymentId })
    .from(settlementItems)
    .innerJoin(settlementBatches, eq(settlementBatches.id, settlementItems.settlementBatchId))
    .where(inArray(settlementBatches.status, ["in_process", "paid"]));

  // Pagos aprobados en ventana con snapshot de comisión
  const { appointments } = await import("../schema");
  const rows = await db
    .select({
      payment: payments,
      professionalProfileId: appointments.professionalProfileId,
    })
    .from(payments)
    .innerJoin(appointments, eq(appointments.id, payments.appointmentId))
    .where(
      and(
        eq(payments.status, "approved"),
        gte(payments.approvedAt, input.periodStart),
        lt(payments.approvedAt, input.periodEnd),
        sql`${payments.commissionCents} IS NOT NULL`,
      ),
    );

  const assignedRows = await assigned;
  const assignedIds = new Set(assignedRows.map((r) => r.paymentId));
  const byPro = new Map<string, typeof rows>();
  for (const row of rows) {
    if (assignedIds.has(row.payment.id)) continue;
    const list = byPro.get(row.professionalProfileId) ?? [];
    list.push(row);
    byPro.set(row.professionalProfileId, list);
  }

  let created = 0;
  for (const [professionalProfileId, items] of byPro) {
    const gross = items.reduce((a, i) => a + i.payment.amountCents, 0);
    const commission = items.reduce((a, i) => a + (i.payment.commissionCents ?? 0), 0);
    const net = items.reduce((a, i) => a + (i.payment.netCents ?? 0), 0);
    const currency = items[0]?.payment.currency ?? "ARS";
    const key = `${professionalProfileId}:${input.periodStart.toISOString()}:${input.periodEnd.toISOString()}`;

    const [batch] = await db
      .insert(settlementBatches)
      .values({
        professionalProfileId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        status: "calculated",
        grossCents: gross,
        commissionCents: commission,
        netCents: net,
        currency,
        idempotencyKey: key,
      })
      .onConflictDoNothing()
      .returning();

    if (!batch) continue;

    for (const item of items) {
      await db.insert(settlementItems).values({
        settlementBatchId: batch.id,
        paymentId: item.payment.id,
      });
    }

    await db
      .update(settlementBatches)
      .set({ status: "in_process", updatedAt: new Date() })
      .where(eq(settlementBatches.id, batch.id));

    if (input.mockPay) {
      await db
        .update(settlementBatches)
        .set({ status: "paid", paidAt: new Date(), updatedAt: new Date() })
        .where(eq(settlementBatches.id, batch.id));
    } else {
      await db
        .update(settlementBatches)
        .set({
          status: "failed",
          failureCode: "PAYOUT_PROVIDER_UNAVAILABLE",
          failureMessage: "Proveedor de liquidación no configurado.",
          updatedAt: new Date(),
        })
        .where(eq(settlementBatches.id, batch.id));
    }

    created += 1;
  }

  return created;
}

export async function retryFailedSettlement(
  db: Db,
  batchId: string,
  mockPay: boolean,
): Promise<void> {
  const [batch] = await db
    .select()
    .from(settlementBatches)
    .where(and(eq(settlementBatches.id, batchId), eq(settlementBatches.status, "failed")));
  if (!batch) throw new Error("Lote no encontrado o no está fallido.");

  await db
    .update(settlementBatches)
    .set({
      status: "in_process",
      failureCode: null,
      failureMessage: null,
      updatedAt: new Date(),
    })
    .where(eq(settlementBatches.id, batchId));

  if (mockPay) {
    await db
      .update(settlementBatches)
      .set({ status: "paid", paidAt: new Date(), updatedAt: new Date() })
      .where(eq(settlementBatches.id, batchId));
  } else {
    await db
      .update(settlementBatches)
      .set({
        status: "failed",
        failureCode: "PAYOUT_PROVIDER_UNAVAILABLE",
        failureMessage: "Reintento sin proveedor configurado.",
        updatedAt: new Date(),
      })
      .where(eq(settlementBatches.id, batchId));
  }
}
