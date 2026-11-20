import { SCHEDULE_SLOT_CONFLICT_MESSAGE } from "@telehealth/domain";

export class ScheduleConflictError extends Error {
  constructor(message = SCHEDULE_SLOT_CONFLICT_MESSAGE) {
    super(message);
    this.name = "ScheduleConflictError";
  }
}

export function isPgUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  while (current && typeof current === "object") {
    if ("code" in current && (current as { code: string }).code === "23505") {
      return true;
    }
    current =
      "cause" in current && (current as { cause: unknown }).cause
        ? (current as { cause: unknown }).cause
        : null;
  }
  return false;
}
