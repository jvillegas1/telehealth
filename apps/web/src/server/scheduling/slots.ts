import { eq } from "drizzle-orm";

import { bookAppointment, loadBusyIntervals, type Db } from "@telehealth/db";
import {
  patientProfiles,
  professionalAvailabilityExceptions,
  professionalAvailabilityRules,
  professionalProfiles,
} from "@telehealth/db/schema";
import { generateBookableSlots, type BookableSlot } from "@telehealth/domain";

export async function getProfessionalSlots(
  db: Db,
  professionalProfileId: string,
  patientTimeZone: string,
): Promise<BookableSlot[]> {
  const [pro] = await db
    .select()
    .from(professionalProfiles)
    .where(eq(professionalProfiles.id, professionalProfileId));

  if (!pro) return [];

  const rules = await db
    .select()
    .from(professionalAvailabilityRules)
    .where(eq(professionalAvailabilityRules.professionalProfileId, professionalProfileId));

  const exceptions = await db
    .select()
    .from(professionalAvailabilityExceptions)
    .where(eq(professionalAvailabilityExceptions.professionalProfileId, professionalProfileId));

  const busy = await loadBusyIntervals(db, professionalProfileId);

  return generateBookableSlots({
    rules: rules.map((r) => ({
      dayOfWeek: r.dayOfWeek,
      startTime: String(r.startTime),
      endTime: String(r.endTime),
      slotMinutes: r.slotMinutes,
      bufferMinutes: r.bufferMinutes,
    })),
    exceptions: exceptions.map((e) => ({
      kind: e.kind,
      startsAt: e.startsAt,
      endsAt: e.endsAt,
    })),
    busy,
    professionalTimeZone: pro.timezone,
    patientTimeZone,
  });
}

export async function getPatientTimeZone(db: Db, userId: string): Promise<string> {
  const [profile] = await db
    .select()
    .from(patientProfiles)
    .where(eq(patientProfiles.userId, userId));
  return profile?.timezone ?? "America/Argentina/Buenos_Aires";
}

export { bookAppointment };
