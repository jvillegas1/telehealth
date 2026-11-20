export type CancellationPolicy = {
  version: number;
  minCancelHours: number;
  minRescheduleHours: number;
  summary: string;
};

export function canCancelAppointment(params: {
  scheduledAt: Date;
  now: Date;
  policy: CancellationPolicy;
}): { allowed: boolean; reason?: string } {
  const hoursUntil = (params.scheduledAt.getTime() - params.now.getTime()) / (60 * 60 * 1000);
  if (hoursUntil < params.policy.minCancelHours) {
    return {
      allowed: false,
      reason: `La política exige cancelar con al menos ${params.policy.minCancelHours} horas de anticipación.`,
    };
  }
  return { allowed: true };
}

export function canRescheduleAppointment(params: {
  scheduledAt: Date;
  now: Date;
  policy: CancellationPolicy;
}): { allowed: boolean; reason?: string } {
  const hoursUntil = (params.scheduledAt.getTime() - params.now.getTime()) / (60 * 60 * 1000);
  if (hoursUntil < params.policy.minRescheduleHours) {
    return {
      allowed: false,
      reason: `La política exige reprogramar con al menos ${params.policy.minRescheduleHours} horas de anticipación.`,
    };
  }
  return { allowed: true };
}
