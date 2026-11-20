import { and, desc, eq, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auditLog } from "@telehealth/db/schema";
import { AdminPermission } from "@telehealth/domain";

import { requireAdmin } from "@/server/admin/guard";

export async function GET(request: Request): Promise<Response> {
  const gate = await requireAdmin(AdminPermission.AuditRead);
  if (!gate.ok) return gate.response;

  const url = new URL(request.url);
  const actor = url.searchParams.get("actor");
  const resourceType = url.searchParams.get("resourceType");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const conditions = [];
  if (actor) conditions.push(eq(auditLog.actorUserId, actor));
  if (resourceType) conditions.push(eq(auditLog.resourceType, resourceType));
  if (from) conditions.push(gte(auditLog.createdAt, new Date(from)));
  if (to) conditions.push(lte(auditLog.createdAt, new Date(to)));

  const rows = await gate.db
    .select()
    .from(auditLog)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(auditLog.createdAt))
    .limit(200);

  return NextResponse.json({
    entries: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
