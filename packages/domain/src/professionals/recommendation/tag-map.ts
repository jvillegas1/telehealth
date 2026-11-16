import type { ProfessionalSpecialty } from "../specialties";
import { SPECIALTY_LABELS } from "../specialties";

/** Mapeo explícito etiquetas de autoevaluación (Etapa 3) → especialidades del directorio. */
export const ASSESSMENT_TAG_TO_SPECIALTIES: Record<string, ProfessionalSpecialty[]> = {
  "psicología clínica": ["psicologia-clinica"],
  "psicologia clinica": ["psicologia-clinica"],
  "escucha activa": ["acompanamiento-emocional", "psicologia-clinica"],
  "enfoque contextual": ["terapia-cognitivo-conductual", "psicologia-clinica"],
  mindfulness: ["mindfulness", "ansiedad-y-estres"],
  "manejo del estrés": ["estres-laboral", "ansiedad-y-estres"],
  "estrés laboral": ["estres-laboral"],
  duelo: ["duelo"],
  familia: ["terapia-familiar"],
  "terapia familiar": ["terapia-familiar"],
  ansiedad: ["ansiedad-y-estres"],
  "bienestar emocional": ["acompanamiento-emocional"],
};

export function mapAssessmentTagsToSpecialties(tags: string[]): ProfessionalSpecialty[] {
  const out = new Set<ProfessionalSpecialty>();
  for (const raw of tags) {
    const key = raw.trim().toLowerCase();
    const mapped = ASSESSMENT_TAG_TO_SPECIALTIES[key];
    if (mapped) {
      for (const s of mapped) {
        out.add(s);
      }
    }
  }
  return [...out];
}

export function specialtyLabel(slug: string): string {
  if (slug in SPECIALTY_LABELS) {
    return SPECIALTY_LABELS[slug as ProfessionalSpecialty];
  }
  return slug;
}