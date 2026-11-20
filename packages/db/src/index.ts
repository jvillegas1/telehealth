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
export const DB_PACKAGE_READY = true as const;
