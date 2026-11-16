import { describe, expect, it } from "vitest";

import { validateOrientativeCopy } from "../guardrails/no-diagnosis";
import { assessmentOutputSchema } from "../schema/output";

const FAILURES = [
  "tienes depresión",
  "diagnóstico: ansiedad",
  "trastorno bipolar",
  "según DSM-5",
  "conclusión clínica",
];

describe("fallas simuladas del modelo (REQ-MOD-01)", () => {
  it("rechaza 5 salidas con lenguaje clínico", () => {
    for (const resumen of FAILURES) {
      expect(validateOrientativeCopy([resumen])).toBe(false);
      const parsed = assessmentOutputSchema.safeParse({
        resumen,
        areasDeAtencion: ["x"],
        perfilProfesionalSugerido: ["y"],
        nivelUrgencia: "bajo",
        promptVersion: "1.0.0",
      });
      if (parsed.success) {
        expect(validateOrientativeCopy([parsed.data.resumen])).toBe(false);
      }
    }
  });
});