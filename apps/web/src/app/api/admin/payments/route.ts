import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

import { recordAdminAudit } from "@telehealth/db";
import { payments } from "@telehealth/db/schema";
import { AdminPermission } from "@telehealth/domain";

import { requireAdmin } from "@/server/admin/guard";

export async function GET(request: Request): Promise<Response> {
  const gate = await requireAdmin(AdminPermission.PaymentsRead);
  if (!gate.ok) return gate.response;

  const status = new URL(request.url).searchParams.get("status");
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
    .limit(100);

  const filtered = status ? rows.filter((r) => r.status === status) : rows;

  await recordAdminAudit(gate.db, {
    actorUserId: gate.userId,
    action: "admin_payments_list",
    resourceType: "payments",
    resourceId: gate.userId,
    metadata: { count: String(filtered.length) },
  });

  return NextResponse.json({ payments: filtered });
}
