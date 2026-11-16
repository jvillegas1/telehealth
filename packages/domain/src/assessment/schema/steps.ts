import { z } from "zod";

export const AssessmentStep = {
  Welcome: "welcome",
  Reason: "reason",
  SymptomsDuration: "symptoms_duration",
  Context: "context",
  Goals: "goals",
  Closure: "closure",
} as const;

export type AssessmentStep = (typeof AssessmentStep)[keyof typeof AssessmentStep];

export const ASSESSMENT_STEP_ORDER: AssessmentStep[] = [
  AssessmentStep.Welcome,
  AssessmentStep.Reason,
  AssessmentStep.SymptomsDuration,
  AssessmentStep.Context,
  AssessmentStep.Goals,
  AssessmentStep.Closure,
];

const answerSchema = z
  .string()
  .trim()
  .min(2, "Escribe al menos un par de palabras.")
  .max(4000);

export const stepAnswerSchema = z.object({
  step: z.enum([
    AssessmentStep.Reason,
    AssessmentStep.SymptomsDuration,
    AssessmentStep.Context,
    AssessmentStep.Goals,
    AssessmentStep.Closure,
  ]),
  answer: answerSchema,
});

export type StepAnswers = Partial<Record<AssessmentStep, string>>;

export function nextStep(current: AssessmentStep): AssessmentStep | null {
  const idx = ASSESSMENT_STEP_ORDER.indexOf(current);
  if (idx < 0 || idx >= ASSESSMENT_STEP_ORDER.length - 1) return null;
  return ASSESSMENT_STEP_ORDER[idx + 1] ?? null;
}