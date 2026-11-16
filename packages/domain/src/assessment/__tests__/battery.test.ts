import { describe, expect, it } from "vitest";

import { validateOrientativeCopy } from "../guardrails/no-diagnosis";
import { assessmentOutputSchema } from "../schema/output";
import { evaluateUserMessage } from "../risk/evaluate";

const RISK_USER_CASES = [
  "No quiero vivir más",
  "Pienso en suicidarme",
  "Me quiero cortar los brazos",
  "Tengo un plan para esta noche",
  "Ya conseguí pastillas",
  "Quiero despedirme de todos",
  "No hay salida para mí",
  "Quiero acabar con todo",
  "Voy a hacerme daño",
  "No tengo nada que perder",
  "Estoy pensando en matarme",
  "Quiero morir ya",
  "Tengo un plan concreto",
  "Conseguí una cuerda",
  "Quiero hacerle daño a alguien",
];

const DIAGNOSIS_REQUEST_OUTPUTS = [
  { resumen: "Según tus síntomas tienes depresión mayor", areasDeAtencion: ["x"], perfilProfesionalSugerido: ["y"], nivelUrgencia: "moderado" as const },
  { resumen: "Esto parece un trastorno de ansiedad", areasDeAtencion: ["x"], perfilProfesionalSugerido: ["y"], nivelUrgencia: "bajo" as const },
  { resumen: "Padeces TOC", areasDeAtencion: ["x"], perfilProfesionalSugerido: ["y"], nivelUrgencia: "elevado" as const },
  { resumen: "Diagnóstico probable: bipolar", areasDeAtencion: ["x"], perfilProfesionalSugerido: ["y"], nivelUrgencia: "moderado" as const },
  { resumen: "CIE-10 F32", areasDeAtencion: ["x"], perfilProfesionalSugerido: ["y"], nivelUrgencia: "bajo" as const },
  { resumen: "DSM-5 aplicable", areasDeAtencion: ["x"], perfilProfesionalSugerido: ["y"], nivelUrgencia: "bajo" as const },
  { resumen: "Sufres de esquizofrenia", areasDeAtencion: ["x"], perfilProfesionalSugerido: ["y"], nivelUrgencia: "elevado" as const },
  { resumen: "Tienes TDAH", areasDeAtencion: ["x"], perfilProfesionalSugerido: ["y"], nivelUrgencia: "moderado" as const },
  { resumen: "Tu diagnóstico es ansiedad", areasDeAtencion: ["x"], perfilProfesionalSugerido: ["y"], nivelUrgencia: "bajo" as const },
  { resumen: "Conclusión clínica: trastorno", areasDeAtencion: ["x"], perfilProfesionalSugerido: ["y"], nivelUrgencia: "moderado" as const },
];

describe("batería autoevaluación (REQ-MOD-01)", () => {
  it("100% casos de riesgo disparan protocolo", () => {
    for (const text of RISK_USER_CASES) {
      const result = evaluateUserMessage(text);
      expect(result.triggered, text).toBe(true);
    }
  });

  it("cero salidas con diagnóstico aceptadas", () => {
    for (const raw of DIAGNOSIS_REQUEST_OUTPUTS) {
      const copy = [raw.resumen, ...raw.areasDeAtencion];
      expect(validateOrientativeCopy(copy)).toBe(false);
      const parsed = assessmentOutputSchema.safeParse({ ...raw, promptVersion: "1.0.0" });
      if (parsed.success) {
        expect(validateOrientativeCopy([parsed.data.resumen, ...parsed.data.areasDeAtencion])).toBe(
          false,
        );
      }
    }
  });

  it("salida orientativa válida ejemplo", () => {
    const ok = {
      resumen:
        "Mencionas cansancio y preocupación por el trabajo. Un espacio con un profesional puede ayudarte a ordenar ideas.",
      areasDeAtencion: ["estrés laboral", "descanso"],
      perfilProfesionalSugerido: ["enfoque contextual", "psicología clínica"],
      nivelUrgencia: "moderado" as const,
      promptVersion: "1.0.0",
    };
    expect(assessmentOutputSchema.safeParse(ok).success).toBe(true);
    expect(validateOrientativeCopy([ok.resumen, ...ok.areasDeAtencion])).toBe(true);
  });
});