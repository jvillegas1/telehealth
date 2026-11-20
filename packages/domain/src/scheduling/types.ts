export type WeeklyRule = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  bufferMinutes: number;
};

export type AvailabilityException = {
  kind: "closed" | "extra_open";
  startsAt: Date;
  endsAt: Date;
};

export type BusyInterval = {
  start: Date;
  end: Date;
};

export type BookableSlot = {
  startUtc: Date;
  endUtc: Date;
  labelInPatientZone: string;
};

export const SCHEDULE_SLOT_CONFLICT_MESSAGE = "Ese horario acaba de ser reservado. Elegí otro.";

export const SCHEDULING_HORIZON_WEEKS = 6;
