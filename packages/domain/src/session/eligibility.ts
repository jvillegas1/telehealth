export const SESSION_JOIN_WINDOW_MS = 15 * 60 * 1000;

export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type PaymentStatus = "pending" | "approved" | "rejected" | "refunded" | "expired";

export type SessionJoinInput = {
  now: Date;
  scheduledAt: Date;
  scheduledEndAt: Date;
  appointmentStatus: AppointmentStatus;
  paymentStatus: PaymentStatus | null;
  requirePayment: boolean;
};

export type SessionJoinDenial =
  | "appointment_not_confirmed"
  | "payment_required"
  | "outside_window"
  | "appointment_cancelled"
  | "appointment_completed";

export type SessionJoinResult = { allowed: true } | { allowed: false; reason: SessionJoinDenial };

export function evaluateSessionJoin(input: SessionJoinInput): SessionJoinResult {
  if (input.appointmentStatus === "cancelled") {
    return { allowed: false, reason: "appointment_cancelled" };
  }
  if (input.appointmentStatus === "completed") {
    return { allowed: false, reason: "appointment_completed" };
  }
  if (input.appointmentStatus !== "confirmed") {
    return { allowed: false, reason: "appointment_not_confirmed" };
  }
  if (input.requirePayment && input.paymentStatus !== "approved") {
    return { allowed: false, reason: "payment_required" };
  }

  const windowStart = input.scheduledAt.getTime() - SESSION_JOIN_WINDOW_MS;
  const windowEnd = input.scheduledEndAt.getTime() + SESSION_JOIN_WINDOW_MS;
  const now = input.now.getTime();
  if (now < windowStart || now > windowEnd) {
    return { allowed: false, reason: "outside_window" };
  }

  return { allowed: true };
}

export function canEnableRecording(input: {
  recordingEnabled: boolean;
  patientConsentAt: Date | null;
  professionalConsentAt: Date | null;
}): boolean {
  if (!input.recordingEnabled) return false;
  return input.patientConsentAt !== null && input.professionalConsentAt !== null;
}
