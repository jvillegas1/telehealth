import { describe, expect, it } from "vitest";

import { evaluateSessionJoin, SESSION_JOIN_WINDOW_MS } from "../eligibility";

const base = {
  appointmentStatus: "confirmed" as const,
  paymentStatus: "approved" as const,
  requirePayment: true,
  scheduledAt: new Date("2026-06-01T15:00:00.000Z"),
  scheduledEndAt: new Date("2026-06-01T16:00:00.000Z"),
};

describe("evaluateSessionJoin", () => {
  it("allows inside window with approved payment", () => {
    const now = new Date(base.scheduledAt.getTime() + 5 * 60_000);
    expect(evaluateSessionJoin({ ...base, now })).toEqual({ allowed: true });
  });

  it("denies before window", () => {
    const now = new Date(base.scheduledAt.getTime() - SESSION_JOIN_WINDOW_MS - 1);
    expect(evaluateSessionJoin({ ...base, now })).toEqual({
      allowed: false,
      reason: "outside_window",
    });
  });

  it("denies without payment when required", () => {
    const now = base.scheduledAt;
    expect(evaluateSessionJoin({ ...base, now, paymentStatus: "pending" })).toEqual({
      allowed: false,
      reason: "payment_required",
    });
  });
});
