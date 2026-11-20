import { describe, expect, it } from "vitest";

import { splitPayment } from "../commission";
import { reconcilePaymentSnapshots } from "../reconciliation";
import type { CommissionRule, PaymentSnapshot } from "../types";

const ruleV1: CommissionRule = {
  id: "rule-v1",
  version: 1,
  rateBps: 1500,
  minCommissionCents: null,
  maxCommissionCents: null,
  summary: "15%",
  countryCode: "AR",
};

describe("reconcilePaymentSnapshots @ 1000 payments", () => {
  it("suma netos + comisiones = suma brutos", () => {
    const snapshots: PaymentSnapshot[] = [];
    for (let i = 0; i < 1000; i++) {
      const gross = 1_000 + ((i * 997) % 50_000);
      const split = splitPayment(gross, ruleV1);
      snapshots.push({
        grossCents: split.grossCents,
        commissionCents: split.commissionCents,
        netCents: split.netCents,
      });
    }
    expect(() => reconcilePaymentSnapshots(snapshots)).not.toThrow();
    const gross = snapshots.reduce((a, p) => a + p.grossCents, 0);
    const commission = snapshots.reduce((a, p) => a + p.commissionCents, 0);
    const net = snapshots.reduce((a, p) => a + p.netCents, 0);
    expect(gross).toBe(commission + net);
  });
});
