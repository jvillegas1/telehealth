import { clampCommission, roundCommissionFromGross } from "./default";

/** Argentina: mismo redondeo floor en centavos (impuestos adicionales en fases posteriores). */
export function computeCommissionAr(
  grossCents: number,
  rateBps: number,
  min: number | null,
  max: number | null,
): number {
  const raw = roundCommissionFromGross(grossCents, rateBps);
  return clampCommission(raw, min, max);
}
