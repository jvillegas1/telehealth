import { and, eq, ilike, isNull, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAdminAudit } from "@telehealth/db";
import { users } from "@telehealth/db/schema";
import { AdminPermission } from "@telehealth/domain";

import { requireAdmin } from "@/server/admin/guard";

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("suspend"),
    userId: z.string().uuid(),
    reason: z.string().min(10).max(500),
  }),
  z.object({
    action: z.literal("reactivate"),
    userId: z.string().uuid(),
    reason: z.string().min(10).max(500),
  }),
]);

export async function GET(request: Request): Promise<Response> {
  const gate = await requireAdmin(AdminPermission.UsersRead);
  if (!gate.ok) return gate.response;

  const q = new URL(request.url).searchParams.get("q")?.trim();
  const conditions = q ? [ilike(users.email, `%${q}%`)] : [];

  const rows = await gate.db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      suspendedAt: users.suspendedAt,
      suspensionReason: users.suspensionReason,
    })
    .from(users)
    .where(conditions.length ? and(...conditions) : undefined)
    .limit(50);

  return NextResponse.json({ users: rows });
}

export async function PATCH(request: Request): Promise<Response> {
  const gate = await requireAdmin(AdminPermission.UsersSuspend);
  if (!gate.ok) return gate.response;

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
  }

  const now = new Date();
  if (parsed.data.action === "suspend") {
    await gate.db
      .update(users)
      .set({
        suspendedAt: now,
        suspensionReason: parsed.data.reason,
        suspendedByUserId: gate.userId,
        updatedAt: now,
      })
      .where(and(eq(users.id, parsed.data.userId), isNull(users.suspendedAt)));
  } else {
    await gate.db
      .update(users)
      .set({
        suspendedAt: null,
        suspensionReason: null,
        suspendedByUserId: null,
        updatedAt: now,
      })
      .where(and(eq(users.id, parsed.data.userId), isNotNull(users.suspendedAt)));
  }

  await recordAdminAudit(gate.db, {
    actorUserId: gate.userId,
    action: parsed.data.action === "suspend" ? "user_suspended" : "user_reactivated",
    resourceType: "users",
    resourceId: parsed.data.userId,
    metadata: { reason: parsed.data.reason },
  });

  return NextResponse.json({ ok: true });
}
