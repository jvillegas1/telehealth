import { eq } from "drizzle-orm";

import type { Db } from "../client";
import { therapySessions } from "../schema";

function roomNameForAppointment(appointmentId: string): string {
  return `appt_${appointmentId.replace(/-/g, "")}`;
}

export async function ensureTherapySession(db: Db, appointmentId: string) {
  const [existing] = await db
    .select()
    .from(therapySessions)
    .where(eq(therapySessions.appointmentId, appointmentId));
  if (existing) {
    if (!existing.livekitRoomName) {
      const roomName = roomNameForAppointment(appointmentId);
      const [updated] = await db
        .update(therapySessions)
        .set({ livekitRoomName: roomName })
        .where(eq(therapySessions.id, existing.id))
        .returning();
      return updated!;
    }
    return existing;
  }

  const roomName = roomNameForAppointment(appointmentId);
  const [created] = await db
    .insert(therapySessions)
    .values({
      appointmentId,
      livekitRoomName: roomName,
      e2eeEnabled: true,
      recordingEnabled: false,
      subtitlesEnabled: false,
    })
    .returning();
  return created!;
}
