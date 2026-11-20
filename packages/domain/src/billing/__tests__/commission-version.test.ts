import { describe, expect, it } from "vitest";

import { splitPayment } from "../commission";
import type { CommissionRule } from "../types";

describe("commission rule versioning", () => {
  it("no altera splits ya calculados al cambiar la regla activa", () => {
    const ruleV1: CommissionRule = {
      id: "r1",
      version: 1,
      rateBps: 1000,
      minCommissionCents: null,
      maxCommissionCents: null,
      summary: "10%",
    };
    const ruleV2: CommissionRule = {
      id: "r2",
      version: 2,
      rateBps: 2000,
      minCommissionCents: null,
      maxCommissionCents: null,
      summary: "20%",
    };

    const historical = splitPayment(10_000, ruleV1);
    const previewNew = splitPayment(10_000, ruleV2);

    expect(historical.commissionCents).toBe(1000);
    expect(historical.commissionRuleVersion).toBe(1);
    expect(previewNew.commissionCents).toBe(2000);
    expect(historical.commissionCents).toBe(1000);
  });
});
