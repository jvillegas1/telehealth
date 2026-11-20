import { and, desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

import { createDb, loadActiveCommissionRule } from "@telehealth/db";
import { appointments, countries, patientProfiles, payments } from "@telehealth/db/schema";
import { previewSplit } from "@telehealth/domain";

import { auth } from "@/auth/auth";
import { getServerEnv } from "@/env.server";
import { getProfessionalProfileForUser } from "@/server/billing/professional-context";

export async function GET(): Promise<Response> {
  const session = await auth();
  if (session?.user?.role !== "professional" || !session.user.id) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) return NextResponse.json({ appointments: [] });

  const db = createDb(url);
  const profile = await getProfessionalProfileForUser(db, session.user.id);
  if (!profile) return NextResponse.json({ appointments: [] });

  const rows = await db
    .select({
      appointment: appointments,
      patientName: patientProfiles.displayName,
      payment: payments,
    })
    .from(appointments)
    .innerJoin(patientProfiles, eq(patientProfiles.id, appointments.patientProfileId))
    .leftJoin(payments, eq(payments.appointmentId, appointments.id))
    .where(
      and(
        eq(appointments.professionalProfileId, profile.id),
        inArray(appointments.status, ["pending", "confirmed"]),
      ),
    )
    .orderBy(desc(appointments.scheduledAt));

  let countryCode: string | undefined;
  if (profile.countryId) {
    const [c] = await db.select().from(countries).where(eq(countries.id, profile.countryId));
    countryCode = c?.code;
  }

  const rule = await loadActiveCommissionRule(db, profile.countryId, countryCode);

  return NextResponse.json({
    appointments: rows.map((r) => {
      const gross = r.payment?.amountCents ?? profile.feeCents ?? 0;
      let split = null;
      if (rule && gross > 0) {
        const ruleForPreview =
          countryCode || rule.countryCode
            ? { ...rule, ...(countryCode ? { countryCode } : {}) }
            : rule;
        split = previewSplit(gross, ruleForPreview);
      }
      return {
        id: r.appointment.id,
        status: r.appointment.status,
        scheduledAt: r.appointment.scheduledAt.toISOString(),
        scheduledEndAt: r.appointment.scheduledEndAt.toISOString(),
        patientName: r.patientName,
        currency: r.payment?.currency ?? profile.currency ?? "ARS",
        grossCents: gross,
        commissionCents: split?.commissionCents ?? null,
        netCents: split?.netCents ?? null,
        commissionSummary: rule?.summary ?? null,
        paymentStatus: r.payment?.status ?? null,
      };
    }),
  });
}
