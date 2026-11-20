import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { crisisResources } from "@telehealth/db/schema";

import { recordAdminAudit } from "@telehealth/db";
import { AdminPermission } from "@telehealth/domain";

import { requireAdmin } from "@/server/admin/guard";

const verifySchema = z.object({
  id: z.string().uuid(),
  active: z.boolean(),
});

export async function GET(): Promise<Response> {
  const gate = await requireAdmin(AdminPermission.CrisisManage);
  if (!gate.ok) return gate.response;
  const resources = await gate.db
    .select()
    .from(crisisResources)
    .orderBy(desc(crisisResources.createdAt));
  return NextResponse.json({ resources });
}

export async function PATCH(request: Request): Promise<Response> {
  const gate = await requireAdmin(AdminPermission.CrisisManage);
  if (!gate.ok) return gate.response;
  const parsed = verifySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
  }

  await gate.db
    .update(crisisResources)
    .set({
      active: parsed.data.active,
      verifiedAt: parsed.data.active ? new Date() : null,
      verifiedByUserId: parsed.data.active ? gate.userId : null,
    })
    .where(eq(crisisResources.id, parsed.data.id));

  await recordAdminAudit(gate.db, {
    actorUserId: gate.userId,
    action: "crisis_resource_updated",
    resourceType: "crisis_resources",
    resourceId: parsed.data.id,
    metadata: { active: String(parsed.data.active) },
  });

  return NextResponse.json({ message: "Recurso actualizado." });
}
