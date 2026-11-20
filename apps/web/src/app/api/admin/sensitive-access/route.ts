import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAdminAudit } from "@telehealth/db";
import { sensitiveAccessGrants } from "@telehealth/db/schema";
import { AdminPermission } from "@telehealth/domain";

import { requireAdmin } from "@/server/admin/guard";

const postSchema = z.object({
  resourceType: z.string().min(2).max(80),
  resourceId: z.string().uuid(),
  reason: z.string().min(20).max(500),
});

const patchSchema = z.object({
  grantId: z.string().uuid(),
  decision: z.enum(["approved", "denied"]),
});

export async function GET(): Promise<Response> {
  const gate = await requireAdmin(AdminPermission.SensitiveApprove);
  if (!gate.ok) return gate.response;

  const rows = await gate.db
    .select()
    .from(sensitiveAccessGrants)
    .orderBy(desc(sensitiveAccessGrants.createdAt))
    .limit(100);

  return NextResponse.json({ grants: rows });
}

export async function POST(request: Request): Promise<Response> {
  const gate = await requireAdmin(AdminPermission.SensitiveRequest);
  if (!gate.ok) return gate.response;

  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
  }

  const [row] = await gate.db
    .insert(sensitiveAccessGrants)
    .values({
      requesterUserId: gate.userId,
      resourceType: parsed.data.resourceType,
      resourceId: parsed.data.resourceId,
      reason: parsed.data.reason,
      status: "pending",
    })
    .returning();

  await recordAdminAudit(gate.db, {
    actorUserId: gate.userId,
    action: "sensitive_access_requested",
    resourceType: parsed.data.resourceType,
    resourceId: parsed.data.resourceId,
    metadata: { grantId: row!.id },
  });

  return NextResponse.json({ grantId: row!.id });
}

export async function PATCH(request: Request): Promise<Response> {
  const gate = await requireAdmin(AdminPermission.SensitiveApprove);
  if (!gate.ok) return gate.response;

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
  }

  const expires = new Date(Date.now() + 60 * 60 * 1000);
  await gate.db
    .update(sensitiveAccessGrants)
    .set({
      status: parsed.data.decision === "approved" ? "approved" : "denied",
      approvedByUserId: gate.userId,
      ...(parsed.data.decision === "approved" ? { expiresAt: expires } : {}),
    })
    .where(eq(sensitiveAccessGrants.id, parsed.data.grantId));

  await recordAdminAudit(gate.db, {
    actorUserId: gate.userId,
    action:
      parsed.data.decision === "approved" ? "sensitive_access_approved" : "sensitive_access_denied",
    resourceType: "sensitive_access_grants",
    resourceId: parsed.data.grantId,
    metadata: { decision: parsed.data.decision },
  });

  return NextResponse.json({ ok: true });
}
