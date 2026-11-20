import type { Db } from "../client";
import { auditLog } from "../schema";

export async function recordScheduleAudit(
  db: Db,
  params: {
    actorUserId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    metadata?: Record<string, string>;
  },
): Promise<void> {
  await db.insert(auditLog).values({
    actorUserId: params.actorUserId,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    metadata: params.metadata ?? {},
  });
}
