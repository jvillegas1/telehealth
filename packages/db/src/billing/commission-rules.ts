import { and, desc, eq, isNull } from "drizzle-orm";

import type { CommissionRule } from "@telehealth/domain";

import type { Db } from "../client";
import { commissionRules, countries } from "../schema";

function mapRow(
  rule: typeof commissionRules.$inferSelect,
  countryCode: string | null,
): CommissionRule {
  return {
    id: rule.id,
    version: rule.version,
    rateBps: rule.rateBps,
    minCommissionCents: rule.minCommissionCents,
    maxCommissionCents: rule.maxCommissionCents,
    summary: rule.summary,
    ...(countryCode ? { countryCode } : {}),
  };
}

export async function loadActiveCommissionRule(
  db: Db,
  countryId: string | null,
  countryCode?: string,
): Promise<CommissionRule | null> {
  if (countryId) {
    const [row] = await db
      .select({
        rule: commissionRules,
        code: countries.code,
      })
      .from(commissionRules)
      .leftJoin(countries, eq(countries.id, commissionRules.countryId))
      .where(and(eq(commissionRules.countryId, countryId), eq(commissionRules.active, true)))
      .orderBy(desc(commissionRules.version))
      .limit(1);
    if (row) {
      return mapRow(row.rule, countryCode ?? row.code ?? null);
    }
  }

  const [global] = await db
    .select({ rule: commissionRules })
    .from(commissionRules)
    .where(and(isNull(commissionRules.countryId), eq(commissionRules.active, true)))
    .orderBy(desc(commissionRules.version))
    .limit(1);

  return global ? mapRow(global.rule, countryCode ?? null) : null;
}
