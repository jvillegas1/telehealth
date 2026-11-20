import { computeCommissionAr } from "./adapters/ar";
import { roundCommissionFromGross, clampCommission } from "./adapters/default";
import type { CommissionRule, PaymentSplit } from "./types";

function computeCommissionForCountry(grossCents: number, rule: CommissionRule): number {
  const min = rule.minCommissionCents;
  const max = rule.maxCommissionCents;
  if (rule.countryCode === "AR") {
    return computeCommissionAr(grossCents, rule.rateBps, min, max);
  }
  const raw = roundCommissionFromGross(grossCents, rule.rateBps);
  return clampCommission(raw, min, max);
}

export function splitPayment(grossCents: number, rule: CommissionRule): PaymentSplit {
  if (grossCents < 0) {
    throw new Error("grossCents debe ser >= 0");
  }
  const commissionCents = computeCommissionForCountry(grossCents, rule);
  const netCents = grossCents - commissionCents;
  if (netCents < 0) {
    throw new Error("netCents negativo tras comisión");
  }
  return {
    grossCents,
    commissionCents,
    netCents,
    commissionRuleId: rule.id,
    commissionRuleVersion: rule.version,
  };
}

export function previewSplit(grossCents: number, rule: CommissionRule) {
  return splitPayment(grossCents, rule);
}
