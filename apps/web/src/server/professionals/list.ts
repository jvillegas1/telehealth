import { and, asc, eq, gte, lte, sql } from "drizzle-orm";

import type { Db } from "@telehealth/db";
import {
  availability,
  credentials,
  countries,
  professionalProfiles,
} from "@telehealth/db/schema";
import {
  isProfessionallyListed,
  rankProfessionals,
  rankProfessionalsWithoutIntake,
  type ProfessionalListItem,
  type RecommendationContext,
  type ScoredProfessional,
} from "@telehealth/domain";

export type ProfessionalListFilters = {
  specialty?: string;
  language?: string;
  countryId?: string;
  minFeeCents?: number;
  maxFeeCents?: number;
  availableThisWeek?: boolean;
  limit?: number;
  offset?: number;
};

function rowToItem(
  row: typeof professionalProfiles.$inferSelect,
  hasVerifiedCredential: boolean,
  nextAvailabilityAt: Date | null,
): ProfessionalListItem {
  return {
    id: row.id,
    displayName: row.displayName,
    specialties: row.specialties ?? [],
    therapeuticApproach: row.therapeuticApproach,
    languages: row.languages ?? [],
    feeCents: row.feeCents,
    currency: row.currency,
    countryId: row.countryId,
    photoUrl: row.photoUrl,
    photoAlt: row.photoAlt,
    status: row.status,
    hasVerifiedCredential,
    nextAvailabilityAt,
  };
}

export async function fetchListedProfessionalRows(
  db: Db,
  filters: ProfessionalListFilters,
  now = new Date(),
): Promise<ProfessionalListItem[]> {
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const conditions = [
    eq(professionalProfiles.status, "approved"),
    sql`exists (
      select 1 from ${credentials} c
      where c.professional_profile_id = ${professionalProfiles.id}
        and c.status = 'verified'
    )`,
  ];

  if (filters.specialty) {
    conditions.push(sql`${filters.specialty} = any(${professionalProfiles.specialties})`);
  }
  if (filters.language) {
    conditions.push(sql`${filters.language} = any(${professionalProfiles.languages})`);
  }
  if (filters.countryId) {
    conditions.push(eq(professionalProfiles.countryId, filters.countryId));
  }
  if (filters.minFeeCents !== undefined) {
    conditions.push(gte(professionalProfiles.feeCents, filters.minFeeCents));
  }
  if (filters.maxFeeCents !== undefined) {
    conditions.push(lte(professionalProfiles.feeCents, filters.maxFeeCents));
  }
  if (filters.availableThisWeek) {
    conditions.push(
      sql`exists (
        select 1 from ${availability} a
        where a.professional_profile_id = ${professionalProfiles.id}
          and a.starts_at >= ${now}
          and a.starts_at <= ${weekAhead}
      )`,
    );
  }

  const rows = await db
    .select()
    .from(professionalProfiles)
    .where(and(...conditions))
    .limit(filters.limit ?? 50)
    .offset(filters.offset ?? 0);

  const items: ProfessionalListItem[] = [];
  for (const row of rows) {
    const [nextSlot] = await db
      .select({ startsAt: availability.startsAt })
      .from(availability)
      .where(
        and(
          eq(availability.professionalProfileId, row.id),
          gte(availability.startsAt, now),
        ),
      )
      .orderBy(asc(availability.startsAt))
      .limit(1);

    const item = rowToItem(row, true, nextSlot?.startsAt ?? null);
    if (isProfessionallyListed(item)) {
      items.push(item);
    }
  }

  return items;
}

export async function listProfessionalsForPatient(
  db: Db,
  filters: ProfessionalListFilters,
  recommendation: RecommendationContext | null,
  patientCountryId: string | null,
): Promise<ScoredProfessional[]> {
  const base = await fetchListedProfessionalRows(db, filters);
  if (recommendation && recommendation.suggestedTags.length > 0) {
    return rankProfessionals(base, recommendation);
  }
  return rankProfessionalsWithoutIntake(base, patientCountryId);
}

export async function getPublicProfessionalById(
  db: Db,
  id: string,
): Promise<(ProfessionalListItem & { bio: string | null; countryName: string | null }) | null> {
  const [row] = await db
    .select({
      profile: professionalProfiles,
      countryName: countries.name,
    })
    .from(professionalProfiles)
    .leftJoin(countries, eq(countries.id, professionalProfiles.countryId))
    .where(eq(professionalProfiles.id, id));

  if (!row) {
    return null;
  }

  const [verified] = await db
    .select({ id: credentials.id })
    .from(credentials)
    .where(and(eq(credentials.professionalProfileId, id), eq(credentials.status, "verified")))
    .limit(1);

  const now = new Date();
  const [nextSlot] = await db
    .select({ startsAt: availability.startsAt })
    .from(availability)
    .where(and(eq(availability.professionalProfileId, id), gte(availability.startsAt, now)))
    .orderBy(asc(availability.startsAt))
    .limit(1);

  const item = rowToItem(row.profile, Boolean(verified), nextSlot?.startsAt ?? null);
  if (!isProfessionallyListed(item)) {
    return null;
  }

  return {
    ...item,
    bio: row.profile.bio,
    countryName: row.countryName,
  };
}

export async function fetchCountries(db: Db) {
  return db.select({ id: countries.id, name: countries.name, code: countries.code }).from(countries);
}