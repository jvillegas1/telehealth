export type CommissionRule = {
  id: string;
  version: number;
  rateBps: number;
  minCommissionCents: number | null;
  maxCommissionCents: number | null;
  summary: string;
  countryCode?: string;
};

export type PaymentSplit = {
  grossCents: number;
  commissionCents: number;
  netCents: number;
  commissionRuleId: string;
  commissionRuleVersion: number;
};

export type PaymentSnapshot = {
  grossCents: number;
  commissionCents: number;
  netCents: number;
};
