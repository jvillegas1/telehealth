import {
  ASSESSMENT_PROMPT_VERSION,
  assessmentOutputSchema,
  evaluateModelOutput,
  validateOrientativeCopy,
  type AssessmentOutput,
} from "@telehealth/domain";
import { loadSystemPrompt } from "@telehealth/domain/assessment/prompts";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

export type GenerateAssessmentInput = {
  answers: Record<string, string>;
  apiKey?: string;
  model?: string;
  mock?: boolean;
};

export async function generateAssessmentOutput(
  input: GenerateAssessmentInput,
): Promise<AssessmentOutput> {
  if (input.mock || !input.apiKey || process.env["MOCK_CLAUDE"] === "1") {
    const mock: AssessmentOutput = {
      resumen:
        "Compartiste cómo te has sentido y qué te gustaría trabajar. Este resumen es orientativo para sugerir un tipo de acompañamiento.",
      areasDeAtencion: ["bienestar emocional", "estrés reciente"],
      perfilProfesionalSugerido: ["escucha activa", "enfoque contextual"],
      nivelUrgencia: "moderado",
      promptVersion: ASSESSMENT_PROMPT_VERSION,
    };
    return mock;
  }

  const system = loadSystemPrompt();
  const userPayload = JSON.stringify({ respuestas: input.answers }, null, 2);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": input.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: input.model ?? DEFAULT_MODEL,
      max_tokens: 1024,
      system,
      messages: [
        {
          role: "user",
          content: `Genera el JSON orientativo según estas respuestas:\n${userPayload}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("MODEL_FAILURE");
  }

  const body = (await response.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = body.content?.find((c) => c.type === "text")?.text ?? "";
  const risk = evaluateModelOutput(text);
  if (risk.triggered) {
    throw new Error("MODEL_RISK");
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(text);
  } catch {
    throw new Error("MODEL_FAILURE");
  }

  const validated = assessmentOutputSchema.safeParse({
    ...(parsedJson as object),
    promptVersion: ASSESSMENT_PROMPT_VERSION,
  });
  if (!validated.success) {
    throw new Error("MODEL_FAILURE");
  }

  const copyOk = validateOrientativeCopy([
    validated.data.resumen,
    ...validated.data.areasDeAtencion,
    ...validated.data.perfilProfesionalSugerido,
  ]);
  if (!copyOk) {
    throw new Error("MODEL_DIAGNOSIS");
  }

  return validated.data;
}