import { and, eq, lte } from "drizzle-orm";

import type { Db } from "@telehealth/db";
import { recordScheduleAudit } from "@telehealth/db";
import { notificationJobs, users } from "@telehealth/db/schema";

type PrivacySettings = {
  sessionReminders?: boolean;
};

export async function enqueueAppointmentReminders(
  db: Db,
  params: { appointmentId: string; patientUserId: string; scheduledAt: Date },
): Promise<void> {
  const [user] = await db.select().from(users).where(eq(users.id, params.patientUserId));
  const settings = (user?.privacySettings ?? {}) as PrivacySettings;
  if (settings.sessionReminders === false) {
    return;
  }

  const run24 = new Date(params.scheduledAt.getTime() - 24 * 60 * 60 * 1000);
  const run1 = new Date(params.scheduledAt.getTime() - 60 * 60 * 1000);
  const now = new Date();

  const jobs = [
    { kind: "reminder_24h" as const, runAt: run24 },
    { kind: "reminder_1h" as const, runAt: run1 },
  ].filter((j) => j.runAt > now);

  for (const job of jobs) {
    await db.insert(notificationJobs).values({
      appointmentId: params.appointmentId,
      userId: params.patientUserId,
      kind: job.kind,
      runAt: job.runAt,
    });
  }
}

export async function cancelPendingReminders(db: Db, appointmentId: string): Promise<void> {
  await db
    .update(notificationJobs)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(notificationJobs.appointmentId, appointmentId),
        eq(notificationJobs.status, "pending"),
      ),
    );
}

export async function processDueReminders(db: Db): Promise<number> {
  const now = new Date();
  const due = await db
    .select()
    .from(notificationJobs)
    .where(and(eq(notificationJobs.status, "pending"), lte(notificationJobs.runAt, now)));

  let sent = 0;
  for (const job of due) {
    if (process.env["MOCK_NOTIFICATIONS"] === "1" || process.env["NODE_ENV"] !== "production") {
      await db
        .update(notificationJobs)
        .set({ status: "sent", sentAt: now })
        .where(eq(notificationJobs.id, job.id));
      await recordScheduleAudit(db, {
        actorUserId: job.userId,
        action: "reminder_sent",
        resourceType: "notification_jobs",
        resourceId: job.id,
        metadata: { kind: job.kind },
      });
      sent += 1;
    }
  }

  return sent;
}
