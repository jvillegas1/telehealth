/** Taxonomía cerrada de especialidades visibles en el directorio. */
export const PROFESSIONAL_SPECIALTIES = [
  "psicologia-clinica",
  "terapia-cognitivo-conductual",
  "mindfulness",
  "terapia-familiar",
  "duelo",
  "estres-laboral",
  "ansiedad-y-estres",
  "acompanamiento-emocional",
] as const;

export type ProfessionalSpecialty = (typeof PROFESSIONAL_SPECIALTIES)[number];

export const SPECIALTY_LABELS: Record<ProfessionalSpecialty, string> = {
  "psicologia-clinica": "Psicología clínica",
  "terapia-cognitivo-conductual": "Terapia cognitivo-conductual",
  mindfulness: "Mindfulness",
  "terapia-familiar": "Terapia familiar",
  duelo: "Duelo y pérdidas",
  "estres-laboral": "Estrés laboral",
  "ansiedad-y-estres": "Ansiedad y estrés",
  "acompanamiento-emocional": "Acompañamiento emocional",
};

export function isProfessionalSpecialty(value: string): value is ProfessionalSpecialty {
  return (PROFESSIONAL_SPECIALTIES as readonly string[]).includes(value);
}