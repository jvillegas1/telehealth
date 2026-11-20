import { describe, expect, it } from "vitest";

import { canCancelAppointment, canRescheduleAppointment } from "../cancellation";

const policy = {
  version: 1,
  minCancelHours: 24,
  minRescheduleHours: 24,
  summary: "Demo",
};

describe("política de cancelación", () => {
  it("permite cancelar con más de 24h", () => {
    const now = new Date("2025-06-01T10:00:00.000Z");
    const scheduledAt = new Date("2025-06-03T10:00:00.000Z");
    expect(canCancelAppointment({ scheduledAt, now, policy }).allowed).toBe(true);
  });

  it("bloquea cancelar dentro de 24h", () => {
    const now = new Date("2025-06-01T10:00:00.000Z");
    const scheduledAt = new Date("2025-06-01T20:00:00.000Z");
    expect(canCancelAppointment({ scheduledAt, now, policy }).allowed).toBe(false);
  });

  it("bloquea reprogramar dentro de 24h", () => {
    const now = new Date("2025-06-01T10:00:00.000Z");
    const scheduledAt = new Date("2025-06-02T08:00:00.000Z");
    expect(canRescheduleAppointment({ scheduledAt, now, policy }).allowed).toBe(false);
  });
});
