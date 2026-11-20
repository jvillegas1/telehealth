import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["patient", "professional", "admin"]);

export const adminInternalRoleEnum = pgEnum("admin_internal_role", [
  "verifier",
  "finance",
  "support",
]);

export const sensitiveAccessStatusEnum = pgEnum("sensitive_access_status", [
  "pending",
  "approved",
  "denied",
  "expired",
]);

export const credentialStatusEnum = pgEnum("credential_status", [
  "pending",
  "verified",
  "rejected",
]);

export const consentScopeEnum = pgEnum("consent_scope", ["intake_form_share", "session_recording"]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "approved",
  "rejected",
  "refunded",
  "expired",
]);

export const payoutStatusEnum = pgEnum("payout_status", ["pending", "paid", "failed"]);

export const settlementStatusEnum = pgEnum("settlement_status", [
  "calculated",
  "in_process",
  "paid",
  "failed",
]);

export const assessmentSessionStatusEnum = pgEnum("assessment_session_status", [
  "in_progress",
  "completed",
  "risk_halted",
  "failed",
]);

export const crisisResourceTypeEnum = pgEnum("crisis_resource_type", ["phone", "url", "text"]);

export const professionalProfileStatusEnum = pgEnum("professional_profile_status", [
  "draft",
  "pending_review",
  "approved",
  "rejected",
]);

export const reviewModerationStatusEnum = pgEnum("review_moderation_status", [
  "pending",
  "visible",
  "hidden",
  "reported",
]);

export const availabilityExceptionKindEnum = pgEnum("availability_exception_kind", [
  "closed",
  "extra_open",
]);

export const notificationJobKindEnum = pgEnum("notification_job_kind", [
  "reminder_24h",
  "reminder_1h",
  "credential_decision",
]);

export const notificationJobStatusEnum = pgEnum("notification_job_status", [
  "pending",
  "sent",
  "failed",
  "cancelled",
]);
