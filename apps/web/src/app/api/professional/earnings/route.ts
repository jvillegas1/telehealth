import { and, desc, eq, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";

import { createDb } from "@telehealth/db";
import {
  appointments,
  patientProfiles,
  payments,
  settlementBatches,
  settlementItems,
} from "@telehealth/db/schema";

import { auth } from "@/auth/auth";
import { getServerEnv } from "@/env.server";
import { getProfessionalProfileForUser } from "@/server/billing/professional-context";

export async function GET(request: Request): Promise<Response> {
  const session = await auth();
  if (session?.user?.role !== "professional" || !session.user.id) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const urlObj = new URL(request.url);
  const from = urlObj.searchParams.get("from");
  const to = urlObj.searchParams.get("to");

  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) return NextResponse.json({ earnings: [], settlements: [] });

  const db = createDb(url);
  const profile = await getProfessionalProfileForUser(db, session.user.id);
  if (!profile) return NextResponse.json({ earnings: [], settlements: [] });

  const conditions = [
    eq(appointments.professionalProfileId, profile.id),
    eq(payments.status, "approved"),
  ];
  if (from) conditions.push(gte(payments.approvedAt, new Date(from)));
  if (to) conditions.push(lte(payments.approvedAt, new Date(to)));

  const earnings = await db
    .select({
      paymentId: payments.id,
      appointmentId: appointments.id,
      patientName: patientProfiles.displayName,
      scheduledAt: appointments.scheduledAt,
      grossCents: payments.amountCents,
      commissionCents: payments.commissionCents,
      netCents: payments.netCents,
      currency: payments.currency,
      approvedAt: payments.approvedAt,
      batchStatus: settlementBatches.status,
      batchId: settlementBatches.id,
    })
    .from(payments)
    .innerJoin(appointments, eq(appointments.id, payments.appointmentId))
    .innerJoin(patientProfiles, eq(patientProfiles.id, appointments.patientProfileId))
    .leftJoin(settlementItems, eq(settlementItems.paymentId, payments.id))
    .leftJoin(settlementBatches, eq(settlementBatches.id, settlementItems.settlementBatchId))
    .where(and(...conditions))
    .orderBy(desc(payments.approvedAt));

  const settlements = await db
    .select()
    .from(settlementBatches)
    .where(eq(settlementBatches.professionalProfileId, profile.id))
    .orderBy(desc(settlementBatches.periodEnd));

  return NextResponse.json({
    earnings: earnings.map((e) => ({
      ...e,
      scheduledAt: e.scheduledAt.toISOString(),
      approvedAt: e.approvedAt?.toISOString() ?? null,
      settlementStatus: e.batchStatus ?? "unbatched",
    })),
    settlements: settlements.map((s) => ({
      id: s.id,
      periodStart: s.periodStart.toISOString(),
      periodEnd: s.periodEnd.toISOString(),
      status: s.status,
      grossCents: s.grossCents,
      commissionCents: s.commissionCents,
      netCents: s.netCents,
      currency: s.currency,
      failureMessage: s.failureMessage,
    })),
  });
}
