import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { createDb } from "@telehealth/db";
import { appointments, payments, settlementBatches, settlementItems } from "@telehealth/db/schema";

import { auth } from "@/auth/auth";
import { getServerEnv } from "@/env.server";
import { getProfessionalProfileForUser } from "@/server/billing/professional-context";
import { buildSettlementReceiptPdf } from "@/server/billing/settlement-receipt-pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  if (session?.user?.role !== "professional" || !session.user.id) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const { id } = await params;
  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) return NextResponse.json({ message: "Servicio no disponible." }, { status: 503 });

  const db = createDb(url);
  const profile = await getProfessionalProfileForUser(db, session.user.id);
  if (!profile) return NextResponse.json({ message: "Perfil no encontrado." }, { status: 400 });

  const [batch] = await db
    .select()
    .from(settlementBatches)
    .where(
      and(eq(settlementBatches.id, id), eq(settlementBatches.professionalProfileId, profile.id)),
    );
  if (!batch) return NextResponse.json({ message: "No encontrado." }, { status: 404 });

  const lines = await db
    .select({
      scheduledAt: appointments.scheduledAt,
      grossCents: payments.amountCents,
      commissionCents: payments.commissionCents,
      netCents: payments.netCents,
    })
    .from(settlementItems)
    .innerJoin(payments, eq(payments.id, settlementItems.paymentId))
    .innerJoin(appointments, eq(appointments.id, payments.appointmentId))
    .where(eq(settlementItems.settlementBatchId, batch.id));

  const pdf = await buildSettlementReceiptPdf({
    batchId: batch.id,
    periodStart: batch.periodStart.toISOString().slice(0, 10),
    periodEnd: batch.periodEnd.toISOString().slice(0, 10),
    currency: batch.currency,
    grossCents: batch.grossCents,
    commissionCents: batch.commissionCents,
    netCents: batch.netCents,
    lines: lines.map((l) => ({
      dateLabel: l.scheduledAt.toISOString().slice(0, 16).replace("T", " "),
      grossCents: l.grossCents,
      commissionCents: l.commissionCents ?? 0,
      netCents: l.netCents ?? 0,
    })),
  });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="liquidacion-${id.slice(0, 8)}.pdf"`,
    },
  });
}
