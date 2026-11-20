import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

import { recordAdminAudit } from "@telehealth/db";
import { payments } from "@telehealth/db/schema";
import { AdminPermission } from "@telehealth/domain";

import { requireAdmin } from "@/server/admin/guard";

export async function GET(): Promise<Response> {
  const gate = await requireAdmin(AdminPermission.PaymentsExport);
  if (!gate.ok) return gate.response;

  const rows = await gate.db
    .select({
      id: payments.id,
      appointmentId: payments.appointmentId,
      status: payments.status,
      amountCents: payments.amountCents,
      commissionCents: payments.commissionCents,
      netCents: payments.netCents,
      currency: payments.currency,
      approvedAt: payments.approvedAt,
    })
    .from(payments)
    .orderBy(desc(payments.createdAt))
    .limit(5000);

  const header =
    "payment_id,appointment_id,status,amount_cents,commission_cents,net_cents,currency,approved_at";
  const lines = rows.map(
    (r) =>
      `${r.id},${r.appointmentId},${r.status},${r.amountCents},${r.commissionCents ?? ""},${r.netCents ?? ""},${r.currency},${r.approvedAt?.toISOString() ?? ""}`,
  );

  await recordAdminAudit(gate.db, {
    actorUserId: gate.userId,
    action: "admin_export",
    resourceType: "payments",
    resourceId: gate.userId,
    metadata: { type: "payments_csv", rowCount: String(rows.length) },
  });

  return new NextResponse([header, ...lines].join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="payments-export.csv"',
    },
  });
}
