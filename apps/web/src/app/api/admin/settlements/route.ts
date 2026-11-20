import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

import { recordAdminAudit } from "@telehealth/db";
import { settlementBatches } from "@telehealth/db/schema";
import { AdminPermission } from "@telehealth/domain";

import { requireAdmin } from "@/server/admin/guard";

export async function GET(): Promise<Response> {
  const gate = await requireAdmin(AdminPermission.SettlementsRead);
  if (!gate.ok) return gate.response;

  const batches = await gate.db
    .select()
    .from(settlementBatches)
    .orderBy(desc(settlementBatches.periodEnd))
    .limit(200);

  await recordAdminAudit(gate.db, {
    actorUserId: gate.userId,
    action: "admin_settlements_list",
    resourceType: "settlement_batches",
    resourceId: gate.userId,
    metadata: { count: String(batches.length) },
  });

  return NextResponse.json({ settlements: batches });
}
