import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAdminAudit } from "@telehealth/db";
import { credentialDocuments, credentials, professionalProfiles } from "@telehealth/db/schema";
import { AdminPermission } from "@telehealth/domain";

import { notifyCredentialDecision } from "@/server/admin/notify-professional";
import { requireAdmin } from "@/server/admin/guard";

const patchSchema = z.object({
  profileId: z.string().uuid(),
  credentialId: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  rejectionReason: z.string().min(10).max(500).optional(),
});

export async function GET(): Promise<Response> {
  const gate = await requireAdmin(AdminPermission.CredentialsRead);
  if (!gate.ok) return gate.response;

  const queue = await gate.db
    .select({
      profile: professionalProfiles,
      credentialId: credentials.id,
      licenseNumber: credentials.licenseNumber,
      issuingBody: credentials.issuingBody,
      credentialStatus: credentials.status,
      documentId: credentialDocuments.id,
    })
    .from(professionalProfiles)
    .innerJoin(credentials, eq(credentials.professionalProfileId, professionalProfiles.id))
    .leftJoin(credentialDocuments, eq(credentialDocuments.credentialId, credentials.id))
    .where(eq(professionalProfiles.status, "pending_review"));

  return NextResponse.json({ queue });
}

export async function PATCH(request: Request): Promise<Response> {
  const gate = await requireAdmin(AdminPermission.CredentialsReview);
  if (!gate.ok) return gate.response;

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
  }

  if (parsed.data.decision === "reject" && !parsed.data.rejectionReason) {
    return NextResponse.json({ message: "Indicá el motivo del rechazo." }, { status: 400 });
  }

  const now = new Date();

  if (parsed.data.decision === "approve") {
    await gate.db
      .update(credentials)
      .set({
        status: "verified",
        verifiedAt: now,
        verifiedByUserId: gate.userId,
        reviewedAt: now,
        rejectionReason: null,
        updatedAt: now,
      })
      .where(eq(credentials.id, parsed.data.credentialId));

    await gate.db
      .update(professionalProfiles)
      .set({ status: "approved", publishedAt: now, updatedAt: now })
      .where(eq(professionalProfiles.id, parsed.data.profileId));

    await notifyCredentialDecision(gate.db, {
      professionalProfileId: parsed.data.profileId,
      approved: true,
    });
  } else {
    await gate.db
      .update(credentials)
      .set({
        status: "rejected",
        rejectionReason: parsed.data.rejectionReason ?? null,
        reviewedAt: now,
        updatedAt: now,
      })
      .where(eq(credentials.id, parsed.data.credentialId));

    await gate.db
      .update(professionalProfiles)
      .set({ status: "rejected", publishedAt: null, updatedAt: now })
      .where(eq(professionalProfiles.id, parsed.data.profileId));

    await notifyCredentialDecision(gate.db, {
      professionalProfileId: parsed.data.profileId,
      approved: false,
      ...(parsed.data.rejectionReason !== undefined ? { reason: parsed.data.rejectionReason } : {}),
    });
  }

  const metadata: Record<string, string> = {
    decision: parsed.data.decision,
    profileId: parsed.data.profileId,
  };
  if (parsed.data.rejectionReason) {
    metadata["rejectionReason"] = parsed.data.rejectionReason;
  }

  await recordAdminAudit(gate.db, {
    actorUserId: gate.userId,
    action: parsed.data.decision === "approve" ? "credential_approved" : "credential_rejected",
    resourceType: "credentials",
    resourceId: parsed.data.credentialId,
    metadata,
  });

  return NextResponse.json({ message: "Decisión registrada." });
}
