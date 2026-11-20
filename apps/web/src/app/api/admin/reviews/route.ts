import { desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAdminAudit } from "@telehealth/db";
import { professionalReviews } from "@telehealth/db/schema";
import { AdminPermission } from "@telehealth/domain";

import { requireAdmin } from "@/server/admin/guard";

const patchSchema = z.object({
  reviewId: z.string().uuid(),
  status: z.enum(["visible", "hidden"]),
});

export async function GET(): Promise<Response> {
  const gate = await requireAdmin(AdminPermission.ReviewsModerate);
  if (!gate.ok) return gate.response;

  const rows = await gate.db
    .select()
    .from(professionalReviews)
    .where(inArray(professionalReviews.moderationStatus, ["pending", "reported"]))
    .orderBy(desc(professionalReviews.createdAt))
    .limit(100);

  return NextResponse.json({ reviews: rows });
}

export async function PATCH(request: Request): Promise<Response> {
  const gate = await requireAdmin(AdminPermission.ReviewsModerate);
  if (!gate.ok) return gate.response;

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
  }

  await gate.db
    .update(professionalReviews)
    .set({ moderationStatus: parsed.data.status })
    .where(eq(professionalReviews.id, parsed.data.reviewId));

  await recordAdminAudit(gate.db, {
    actorUserId: gate.userId,
    action: "review_moderated",
    resourceType: "professional_reviews",
    resourceId: parsed.data.reviewId,
    metadata: { status: parsed.data.status },
  });

  return NextResponse.json({ ok: true });
}
