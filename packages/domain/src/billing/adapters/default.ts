/**
 * Redondeo por defecto: comisión = floor(gross * bps / 10000), net = gross - commission (enteros).
 */
export function roundCommissionFromGross(grossCents: number, rateBps: number): number {
  if (grossCents <= 0 || rateBps <= 0) return 0;
  return Math.floor((grossCents * rateBps) / 10_000);
}

export function clampCommission(
  commissionCents: number,
  min: number | null,
  max: number | null,
): number {
  let value = commissionCents;
  if (min !== null && value < min) value = min;
  if (max !== null && value > max) value = max;
  return value;
}
