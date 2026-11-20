import { and, eq, isNull } from "drizzle-orm";

import type { Db } from "@telehealth/db";
import { cancellationPolicies } from "@telehealth/db/schema";
import type { CancellationPolicy } from "@telehealth/domain";

const FALLBACK: CancellationPolicy = {
  version: 1,
  minCancelHours: 24,
  minRescheduleHours: 24,
  summary:
    "Podés cancelar o reprogramar hasta 24 horas antes del inicio. Después de ese plazo, contactá al profesional desde la plataforma.",
};

export async function getCancellationPolicy(
  db: Db,
  countryId: string | null,
): Promise<CancellationPolicy> {
  if (countryId) {
    const [row] = await db
      .select()
      .from(cancellationPolicies)
      .where(
        and(eq(cancellationPolicies.countryId, countryId), eq(cancellationPolicies.active, true)),
      )
      .limit(1);
    if (row) {
      return {
        version: row.version,
        minCancelHours: row.minCancelHours,
        minRescheduleHours: row.minRescheduleHours,
        summary: row.summary,
      };
    }
  }

  const [global] = await db
    .select()
    .from(cancellationPolicies)
    .where(and(isNull(cancellationPolicies.countryId), eq(cancellationPolicies.active, true)))
    .limit(1);

  if (global) {
    return {
      version: global.version,
      minCancelHours: global.minCancelHours,
      minRescheduleHours: global.minRescheduleHours,
      summary: global.summary,
    };
  }

  return FALLBACK;
}
