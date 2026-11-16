"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AssessmentStep } from "@telehealth/domain";
import {
  Alert,
  AssessmentStatePanel,
  AssessmentStepper,
  Button,
  Card,
  ChatBubble,
  Input,
  Label,
  type AssessmentUiState,
} from "@telehealth/ui";

const STEP_INDEX: Record<string, number> = {
  welcome: 0,
  reason: 1,
  symptoms_duration: 2,
  context: 3,
  goals: 4,
  closure: 5,
};

const PROMPTS: Record<string, string> = {
  welcome:
    "Hola. Esta autoevaluación es orientativa: no es un diagnóstico clínico. Te haré algunas preguntas para entender cómo te sientes y qué buscas.",
  reason: "¿Qué te trae a buscar apoyo en este momento?",
  symptoms_duration: "¿Qué has estado sintiendo o notando y desde cuándo?",
  context: "¿Hay algo en tu contexto (trabajo, familia, sueño) que quieras mencionar?",
  goals: "¿Qué te gustaría lograr con un acompañamiento profesional?",
  closure: "¿Hay algo más que quieras sumar antes de generar tu resumen orientativo?",
};

type CrisisResource = {
  title: string;
  description: string;
  contactUri: string;
  resourceType: string;
};

export function AssessmentClient() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [step, setStep] = useState<string>(AssessmentStep.Welcome);
  const [answer, setAnswer] = useState("");
  const [uiState, setUiState] = useState<AssessmentUiState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [riskResources, setRiskResources] = useState<CrisisResource[]>([]);

  const stepIndex = STEP_INDEX[step] ?? 0;

  const init = useCallback(async () => {
    setUiState("loading");
    const res = await fetch("/api/assessment/session", { method: "POST" });
  if (!res.ok) {
      setUiState("error");
      setError("No pudimos iniciar la sesión.");
      return;
    }
    const data = (await res.json()) as {
      sessionId: string;
      resumed: boolean;
      currentStep: string;
    };
    setSessionId(data.sessionId);
    setStep(data.currentStep === AssessmentStep.Welcome ? AssessmentStep.Welcome : data.currentStep);
    setUiState(data.resumed ? "resumed" : "idle");
  }, []);

  useEffect(() => {
    void init();
  }, [init]);

  async function submitAnswer() {
    if (!sessionId || !answer.trim()) return;
    setUiState("loading");
    setError(null);

    if (step === AssessmentStep.Welcome) {
      setStep(AssessmentStep.Reason);
      setAnswer("");
      setUiState("idle");
      return;
    }

    const res = await fetch(`/api/assessment/session/${sessionId}/step`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ step, answer }),
    });
    const data = (await res.json()) as {
      risk?: boolean;
      resources?: CrisisResource[];
      nextStep?: string;
      message?: string;
    };

    if (data.risk) {
      setUiState("risk");
      setRiskResources(data.resources ?? []);
      const fallback = await fetch("/api/assessment/crisis-resources");
      const crisis = (await fallback.json()) as { resources?: CrisisResource[] };
      setRiskResources(crisis.resources ?? data.resources ?? []);
      return;
    }

    if (!res.ok) {
      setUiState("error");
      setError(data.message ?? "Ocurrió un error.");
      return;
    }

    if (step === AssessmentStep.Closure) {
      const fin = await fetch(`/api/assessment/session/${sessionId}/finalize`, { method: "POST" });
      const finData = (await fin.json()) as { intakeFormId?: string; message?: string };
      if (!fin.ok) {
        setUiState("error");
        setError(finData.message ?? "No pudimos generar el resumen.");
        return;
      }
      router.push(`/autoevaluacion/resultado?intake=${finData.intakeFormId ?? ""}`);
      return;
    }

    setStep(data.nextStep ?? AssessmentStep.Reason);
    setAnswer("");
    setUiState("idle");
  }

  const systemMessage = useMemo(() => PROMPTS[step] ?? PROMPTS["welcome"], [step]);

  const statePanelMessage =
    uiState === "resumed"
      ? "Continuamos desde tu último paso guardado."
      : uiState === "error" && error
        ? error
        : null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-4 px-4 py-8">
      <AssessmentStepper currentIndex={stepIndex} />
      <AssessmentStatePanel
        state={uiState}
        {...(statePanelMessage ? { message: statePanelMessage } : {})}
      />

      {uiState === "risk" ? (
        <Card className="space-y-3">
          <h2 className="text-lg font-medium text-calm-900">Recursos de apoyo en tu país</h2>
          <p className="text-sm text-calm-800">
            Detectamos señales que conviene atender con ayuda inmediata. Estos recursos están verificados por
            la plataforma.
          </p>
          <ul className="space-y-2 text-sm">
            {riskResources.map((r) => (
              <li key={`${r.title}-${r.contactUri}`} className="rounded-md border border-calm-100 p-3">
                <p className="font-medium text-calm-900">{r.title}</p>
                <p className="text-calm-800">{r.description}</p>
                {r.resourceType === "url" ? (
                  <a className="underline" href={r.contactUri}>
                    Abrir recurso
                  </a>
                ) : (
                  <p className="text-calm-800">{r.contactUri}</p>
                )}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {uiState !== "risk" ? (
        <>
          <ChatBubble variant="system">{systemMessage}</ChatBubble>
          {step !== AssessmentStep.Welcome ? (
            <div>
              <Label htmlFor="answer">Tu respuesta</Label>
              <Input
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={uiState === "loading"}
              />
            </div>
          ) : null}
          <Button type="button" onClick={() => void submitAnswer()} disabled={uiState === "loading"}>
            {step === AssessmentStep.Welcome
              ? "Entiendo, continuar"
              : step === AssessmentStep.Closure
                ? "Generar resumen orientativo"
                : "Enviar"}
          </Button>
          <Alert variant="info">
            Este resultado es orientativo y no constituye un diagnóstico clínico.
          </Alert>
        </>
      ) : null}

      <Link href="/" className="text-sm text-calm-800 underline">
        Volver al inicio
      </Link>
    </main>
  );
}