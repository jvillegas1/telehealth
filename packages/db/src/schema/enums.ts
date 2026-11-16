import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["patient", "professional", "admin"]);

export const credentialStatusEnum = pgEnum("credential_status", [
  "pending",
  "verified",
  "rejected",
]);

export const consentScopeEnum = pgEnum("consent_scope", ["intake_form_share"]);

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