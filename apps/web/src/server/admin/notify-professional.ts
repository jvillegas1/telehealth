import { eq } from "drizzle-orm";

import type { Db } from "@telehealth/db";
import { notificationJobs, professionalProfiles, users } from "@telehealth/db/schema";

export async function notifyCredentialDecision(
  db: Db,
  params: {
    professionalProfileId: string;
    approved: boolean;
    reason?: string;
  },
): Promise<void> {
  const [pro] = await db
    .select({ userId: professionalProfiles.userId })
    .from(professionalProfiles)
    .where(eq(professionalProfiles.id, params.professionalProfileId));
  if (!pro) return;

  const [user] = await db.select().from(users).where(eq(users.id, pro.userId));
  if (!user) return;

  if (process.env["MOCK_NOTIFICATIONS"] === "1") {
    return;
  }

  await db.insert(notificationJobs).values({
    userId: user.id,
    kind: "credential_decision",
    runAt: new Date(),
    status: "pending",
    lastError: params.approved
      ? "Tu credencial fue aprobada."
      : `Tu credencial fue rechazada. ${params.reason ?? ""}`.trim(),
  });
}
