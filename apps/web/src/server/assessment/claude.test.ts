import { describe, expect, it } from "vitest";

import { generateAssessmentOutput } from "./claude";

describe("generateAssessmentOutput", () => {
  it("usa mock cuando no hay API key", async () => {
    process.env["MOCK_CLAUDE"] = "1";
    const out = await generateAssessmentOutput({ answers: { reason: "estrés" }, mock: true });
    expect(out.perfilProfesionalSugerido.length).toBeGreaterThan(0);
    expect(out.resumen).not.toMatch(/diagnóstico/i);
  });
});