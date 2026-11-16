import { describe, expect, it } from "vitest";

import { mapAssessmentTagsToSpecialties } from "../recommendation/tag-map";
import { rankProfessionals, scoreProfessional } from "../recommendation/score";
import type { ProfessionalListItem, RecommendationContext } from "../types";

const basePro = (overrides: Partial<ProfessionalListItem>): ProfessionalListItem => ({
  id: "1",
  displayName: "Ana",
  specialties: ["psicologia-clinica"],
  therapeuticApproach: "Integrativo",
  languages: ["es"],
  feeCents: 8000,
  currency: "ARS",
  countryId: "country-ar",
  photoUrl: null,
  photoAlt: null,
  status: "approved",
  hasVerifiedCredential: true,
  nextAvailabilityAt: null,
  ...overrides,
});

describe("mapAssessmentTagsToSpecialties", () => {
  it("mapea etiquetas conocidas de la autoevaluación", () => {
    const mapped = mapAssessmentTagsToSpecialties(["escucha activa", "enfoque contextual"]);
    expect(mapped).toContain("acompanamiento-emocional");
    expect(mapped).toContain("terapia-cognitivo-conductual");
  });
});

describe("scoreProfessional — tabla de casos", () => {
  const now = new Date("2025-06-01T12:00:00.000Z");

  const cases: {
    name: string;
    pro: ProfessionalListItem;
    context: RecommendationContext;
    minScore: number;
    reasonIncludes?: string;
  }[] = [
    {
      name: "coincidencia de especialidad",
      pro: basePro({ specialties: ["psicologia-clinica"] }),
      context: { suggestedTags: ["escucha activa"], patientCountryId: null, patientLanguages: [] },
      minScore: 3,
      reasonIncludes: "Coincide con tu orientación",
    },
    {
      name: "sin coincidencia",
      pro: basePro({ specialties: ["duelo"] }),
      context: { suggestedTags: ["mindfulness"], patientCountryId: null, patientLanguages: [] },
      minScore: 0,
    },
    {
      name: "idioma compartido",
      pro: basePro({ languages: ["es", "en"] }),
      context: { suggestedTags: [], patientCountryId: null, patientLanguages: ["en"] },
      minScore: 2,
      reasonIncludes: "idioma",
    },
    {
      name: "mismo país",
      pro: basePro({ countryId: "ar-1" }),
      context: { suggestedTags: [], patientCountryId: "ar-1", patientLanguages: [] },
      minScore: 1,
      reasonIncludes: "país",
    },
    {
      name: "disponibilidad en 7 días",
      pro: basePro({ nextAvailabilityAt: new Date("2025-06-05T10:00:00.000Z") }),
      context: { suggestedTags: [], patientCountryId: null, patientLanguages: [] },
      minScore: 1,
      reasonIncludes: "disponibilidad",
    },
  ];

  it.each(cases)("$name", ({ pro, context, minScore, reasonIncludes }) => {
    const { score, reasons } = scoreProfessional(pro, context, now);
    expect(score).toBeGreaterThanOrEqual(minScore);
    if (reasonIncludes) {
      expect(reasons.join(" ")).toMatch(new RegExp(reasonIncludes, "i"));
    }
  });

  it("ordena por score descendente", () => {
    const low = basePro({ id: "low", displayName: "Baja", specialties: ["duelo"] });
    const high = basePro({
      id: "high",
      displayName: "Alta",
      specialties: ["psicologia-clinica", "acompanamiento-emocional"],
    });
    const ctx: RecommendationContext = {
      suggestedTags: ["escucha activa", "enfoque contextual"],
      patientCountryId: null,
      patientLanguages: [],
    };
    const ranked = rankProfessionals([low, high], ctx, now);
    expect(ranked[0]?.professional.id).toBe("high");
  });
});