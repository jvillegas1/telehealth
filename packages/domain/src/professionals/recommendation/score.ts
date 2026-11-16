import { specialtyLabel } from "./tag-map";
import { mapAssessmentTagsToSpecialties } from "./tag-map";
import type { ProfessionalListItem, RecommendationContext, ScoredProfessional } from "../types";

const SCORE = {
  specialtyMatch: 3,
  languageMatch: 2,
  countryMatch: 1,
  availabilitySoon: 1,
} as const;

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function scoreProfessional(
  professional: ProfessionalListItem,
  context: RecommendationContext,
  now: Date = new Date(),
): ScoredProfessional {
  const targetSpecialties = mapAssessmentTagsToSpecialties(context.suggestedTags);
  const reasons: string[] = [];
  let score = 0;

  if (targetSpecialties.length > 0) {
    const targetSet = new Set<string>(targetSpecialties);
    const overlap = professional.specialties.filter((s) => targetSet.has(s));
    if (overlap.length > 0) {
      score += SCORE.specialtyMatch * overlap.length;
      for (const slug of overlap) {
        reasons.push(`Coincide con tu orientación: ${specialtyLabel(slug)}`);
      }
    }
  }

  if (context.patientLanguages.length > 0 && professional.languages.length > 0) {
    const langHit = professional.languages.some((l) => context.patientLanguages.includes(l));
    if (langHit) {
      score += SCORE.languageMatch;
      reasons.push("Atiende en un idioma que indicaste");
    }
  }

  if (
    context.patientCountryId &&
    professional.countryId &&
    context.patientCountryId === professional.countryId
  ) {
    score += SCORE.countryMatch;
    reasons.push("Trabaja en tu país");
  }

  if (professional.nextAvailabilityAt) {
    const delta = professional.nextAvailabilityAt.getTime() - now.getTime();
    if (delta >= 0 && delta <= ONE_WEEK_MS) {
      score += SCORE.availabilitySoon;
      reasons.push("Tiene disponibilidad en los próximos 7 días");
    }
  }

  return { professional, score, reasons };
}

export function rankProfessionals(
  professionals: ProfessionalListItem[],
  context: RecommendationContext,
  now?: Date,
): ScoredProfessional[] {
  const scored = professionals.map((p) => scoreProfessional(p, context, now));
  return scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.professional.displayName.localeCompare(b.professional.displayName, "es");
  });
}

/** Sin intake: prioriza disponibilidad próxima y mismo país. */
export function rankProfessionalsWithoutIntake(
  professionals: ProfessionalListItem[],
  patientCountryId: string | null,
  now?: Date,
): ScoredProfessional[] {
  return rankProfessionals(
    professionals,
    { suggestedTags: [], patientCountryId, patientLanguages: [] },
    now,
  );
}