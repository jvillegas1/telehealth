import type { ReactNode } from "react";

import { Alert } from "./alert";
import { Card } from "./card";

export type AssessmentUiState = "loading" | "error" | "resumed" | "risk" | "idle";

export function AssessmentStatePanel({
  state,
  message,
  children,
}: {
  state: AssessmentUiState;
  message?: string;
  children?: ReactNode;
}) {
  if (state === "idle") return null;
  const variant =
    state === "error" ? "error" : state === "risk" ? "error" : state === "resumed" ? "info" : "info";

  return (
    <Card className="mb-4 space-y-2">
      {state === "loading" ? (
        <p className="text-sm text-calm-800" role="status">
          Estamos preparando la siguiente pregunta…
        </p>
      ) : (
        <Alert variant={variant}>
          {message ??
            (state === "resumed"
              ? "Retomamos tu sesión desde el último paso guardado."
              : state === "risk"
                ? "Detectamos señales que requieren atención inmediata."
                : "No pudimos continuar. Puedes intentar de nuevo.")}
        </Alert>
      )}
      {children}
    </Card>
  );
}