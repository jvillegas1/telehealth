export { createDb, getPool, type Db } from "./client";
export * from "./schema";
export { encryptField, decryptField, type EncryptedField } from "./crypto/field-encryption";
export { withRlsClient, type RlsContext } from "./rls/with-rls-context";
export { readIntakeFormForActor, type IntakeAccessResult } from "./access/intake-access";
export { encryptProgress, decryptProgress } from "./assessment/progress";
export {
  bookAppointment,
  cancelAppointment,
  loadBusyIntervals,
} from "./scheduling/book-appointment";
export { ScheduleConflictError, isPgUniqueViolation } from "./scheduling/errors";
export { recordScheduleAudit } from "./scheduling/schedule-audit";
export { ensureAppointmentPayment } from "./scheduling/ensure-payment";
export { ensureTherapySession } from "./session/ensure-therapy-session";
export { recordSessionAudit } from "./session/session-audit";
export { loadActiveCommissionRule } from "./billing/commission-rules";
export { approvePaymentWithCommission } from "./billing/approve-payment";
export {
  acceptProfessionalAppointment,
  rejectProfessionalAppointment,
} from "./billing/accept-appointment";
export { runSettlementJob, retryFailedSettlement } from "./billing/settlements";
export { recordAdminAudit } from "./admin/record-admin-audit";
export { loadAdminInternalRoles } from "./admin/load-admin-roles";
export const DB_PACKAGE_READY = true as const;
