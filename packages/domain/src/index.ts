export { UserRole, requiresMfa, isUserRole } from "./roles";
export { isCountryLaunched } from "./countries/launch";
export { isConsentActive, type ConsentRecord } from "./consent";
export * from "./assessment/schema/output";
export * from "./assessment/schema/steps";
export * from "./assessment/risk/evaluate";
export * from "./assessment/risk/signals";
export * from "./assessment/guardrails/no-diagnosis";
export { ASSESSMENT_PROMPT_VERSION } from "./assessment/prompts/version";
export * from "./professionals/types";
export * from "./professionals/specialties";
export { isProfessionallyListed } from "./professionals/visibility";
export {
  ASSESSMENT_TAG_TO_SPECIALTIES,
  mapAssessmentTagsToSpecialties,
  specialtyLabel,
} from "./professionals/recommendation/tag-map";
export {
  scoreProfessional,
  rankProfessionals,
  rankProfessionalsWithoutIntake,
} from "./professionals/recommendation/score";
export { professionalReviewSchema, validateReviewComment } from "./professionals/reviews/comment";
export * from "./scheduling/types";
export { generateBookableSlots } from "./scheduling/slots";
export {
  canCancelAppointment,
  canRescheduleAppointment,
  type CancellationPolicy,
} from "./scheduling/cancellation";
export {
  evaluateSessionJoin,
  canEnableRecording,
  SESSION_JOIN_WINDOW_MS,
  type SessionJoinInput,
  type SessionJoinResult,
} from "./session/eligibility";
export { splitPayment, previewSplit } from "./billing/commission";
export { reconcilePaymentSnapshots } from "./billing/reconciliation";
export { arPayoutFormSchema, AR_PAYOUT_SCHEMA_VERSION } from "./billing/payout-forms/ar";
export type { CommissionRule, PaymentSplit, PaymentSnapshot } from "./billing/types";
export {
  AdminInternalRole,
  AdminPermission,
  hasAdminPermission,
  permissionsForRoles,
} from "./admin/permissions";
export type { AdminInternalRole as AdminInternalRoleType } from "./admin/permissions";
export const DOMAIN_PLACEHOLDER = true as const;
