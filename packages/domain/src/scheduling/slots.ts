import { DateTime, Interval } from "luxon";

import {
  SCHEDULING_HORIZON_WEEKS,
  type AvailabilityException,
  type BookableSlot,
  type BusyInterval,
  type WeeklyRule,
} from "./types";

function parseLocalTimeOnDay(day: DateTime, time: string): DateTime {
  const [h, m, s] = time.split(":").map((p) => Number(p));
  return day.set({ hour: h ?? 0, minute: m ?? 0, second: s ?? 0, millisecond: 0 });
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function isBlocked(slotStart: Date, slotEnd: Date, exceptions: AvailabilityException[]): boolean {
  return exceptions.some(
    (ex) => ex.kind === "closed" && overlaps(slotStart, slotEnd, ex.startsAt, ex.endsAt),
  );
}

function isBusy(slotStart: Date, slotEnd: Date, busy: BusyInterval[]): boolean {
  return busy.some((b) => overlaps(slotStart, slotEnd, b.start, b.end));
}

export function generateBookableSlots(params: {
  rules: WeeklyRule[];
  exceptions: AvailabilityException[];
  busy: BusyInterval[];
  professionalTimeZone: string;
  patientTimeZone: string;
  now?: Date;
  horizonWeeks?: number;
}): BookableSlot[] {
  const now = params.now ?? new Date();
  const horizonWeeks = params.horizonWeeks ?? SCHEDULING_HORIZON_WEEKS;
  const from = DateTime.fromJSDate(now, { zone: params.professionalTimeZone }).startOf("day");
  const to = from.plus({ weeks: horizonWeeks });
  const slots: BookableSlot[] = [];

  for (let cursor = from; cursor < to; cursor = cursor.plus({ days: 1 })) {
    const dayRules = params.rules.filter((r) => r.dayOfWeek === cursor.weekday);
    for (const rule of dayRules) {
      let slotStart = parseLocalTimeOnDay(cursor, rule.startTime);
      const windowEnd = parseLocalTimeOnDay(cursor, rule.endTime);
      const stepMinutes = rule.slotMinutes + rule.bufferMinutes;

      while (slotStart.plus({ minutes: rule.slotMinutes }) <= windowEnd) {
        const slotEnd = slotStart.plus({ minutes: rule.slotMinutes });
        const startUtc = slotStart.toUTC().toJSDate();
        const endUtc = slotEnd.toUTC().toJSDate();

        if (
          startUtc > now &&
          !isBlocked(startUtc, endUtc, params.exceptions) &&
          !isBusy(startUtc, endUtc, params.busy)
        ) {
          const label = slotStart.setZone(params.patientTimeZone).toFormat("ccc d LLL, HH:mm");
          slots.push({ startUtc, endUtc, labelInPatientZone: label });
        }

        slotStart = slotStart.plus({ minutes: stepMinutes });
      }
    }

    for (const ex of params.exceptions) {
      if (ex.kind !== "extra_open") continue;
      const exStart = DateTime.fromJSDate(ex.startsAt).setZone(params.professionalTimeZone);
      const exEnd = DateTime.fromJSDate(ex.endsAt).setZone(params.professionalTimeZone);
      if (!cursor.hasSame(exStart, "day")) continue;
      const duration = Interval.fromDateTimes(exStart, exEnd).length("minutes");
      if (duration <= 0) continue;
      const startUtc = exStart.toUTC().toJSDate();
      const endUtc = exEnd.toUTC().toJSDate();
      if (startUtc > now && !isBusy(startUtc, endUtc, params.busy)) {
        const label = exStart.setZone(params.patientTimeZone).toFormat("ccc d LLL, HH:mm");
        slots.push({ startUtc, endUtc, labelInPatientZone: label });
      }
    }
  }

  return slots.sort((a, b) => a.startUtc.getTime() - b.startUtc.getTime());
}
