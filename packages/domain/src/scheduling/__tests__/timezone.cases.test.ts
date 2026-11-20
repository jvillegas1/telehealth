import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";

import { generateBookableSlots } from "../slots";

describe("generateBookableSlots — zonas horarias y DST", () => {
  const rule = {
    dayOfWeek: 3,
    startTime: "09:00:00",
    endTime: "11:00:00",
    slotMinutes: 50,
    bufferMinutes: 10,
  };

  it("muestra hora del paciente distinta al profesional (AR vs UTC)", () => {
    const slots = generateBookableSlots({
      rules: [rule],
      exceptions: [],
      busy: [],
      professionalTimeZone: "America/Argentina/Buenos_Aires",
      patientTimeZone: "UTC",
      now: new Date("2025-06-01T12:00:00.000Z"),
      horizonWeeks: 1,
    });
    expect(slots.length).toBeGreaterThan(0);
    const first = slots[0]!;
    expect(first.labelInPatientZone).toMatch(/09:00|12:00/);
  });

  it("America/New_York — semana del cambio de horario (marzo 2025)", () => {
    const slots = generateBookableSlots({
      rules: [{ ...rule, dayOfWeek: 1 }],
      exceptions: [],
      busy: [],
      professionalTimeZone: "America/New_York",
      patientTimeZone: "America/Argentina/Buenos_Aires",
      now: new Date("2025-03-08T12:00:00.000Z"),
      horizonWeeks: 2,
    });
    expect(slots.length).toBeGreaterThan(0);
    const utcStarts = slots.map((s) => DateTime.fromJSDate(s.startUtc).toUTC().toISO());
    expect(new Set(utcStarts).size).toBe(utcStarts.length);
  });

  it("excluye franja cerrada por excepción", () => {
    const wednesday = DateTime.fromISO("2025-06-04T15:00:00", {
      zone: "America/Argentina/Buenos_Aires",
    });
    const slots = generateBookableSlots({
      rules: [rule],
      exceptions: [
        {
          kind: "closed",
          startsAt: wednesday.set({ hour: 9 }).toUTC().toJSDate(),
          endsAt: wednesday.set({ hour: 12 }).toUTC().toJSDate(),
        },
      ],
      busy: [],
      professionalTimeZone: "America/Argentina/Buenos_Aires",
      patientTimeZone: "America/Argentina/Buenos_Aires",
      now: new Date("2025-06-01T12:00:00.000Z"),
      horizonWeeks: 1,
    });
    const onBlockedDay = slots.filter((s) => {
      const local = DateTime.fromJSDate(s.startUtc).setZone("America/Argentina/Buenos_Aires");
      return local.toISODate() === "2025-06-04";
    });
    expect(onBlockedDay.length).toBe(0);
  });
});
