import type { Db } from "../client";
import { auditLog } from "../schema";

export async function recordSessionAudit(
  db: Db,
  params: {
    actorUserId: string;
    action: string;
    resourceId: string;
    metadata?: Record<string, string>;
  },
): Promise<void> {
  await db.insert(auditLog).values({
    actorUserId: params.actorUserId,
    action: params.action,
    resourceType: "therapy_sessions",
    resourceId: params.resourceId,
    metadata: params.metadata ?? {},
  });
}
