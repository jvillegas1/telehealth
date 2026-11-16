"use client";

import { useState } from "react";

import { Alert, Button, Card } from "@telehealth/ui";

export function ConsentForm({
  professionalId,
  intakeFormId,
  alreadyGranted,
}: {
  professionalId: string;
  intakeFormId: string;
  alreadyGranted: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    alreadyGranted ? "success" : "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  async function grant() {
    setStatus("loading");
    const res = await fetch("/api/consent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ professionalProfileId: professionalId, intakeFormId }),
    });
    const data = (await res.json()) as { message?: string };
    if (!res.ok) {
      setStatus("error");
      setMessage(data.message ?? "No pudimos guardar tu consentimiento.");
      return;
    }
    setStatus("success");
    setMessage("Consentimiento registrado. Puedes revocarlo desde privacidad cuando esté disponible.");
  }

  async function revoke() {
    setStatus("loading");
    const res = await fetch("/api/consent", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ professionalProfileId: professionalId, intakeFormId }),
    });
    if (!res.ok) {
      setStatus("error");
      setMessage("No pudimos revocar el consentimiento.");
      return;
    }
    setStatus("idle");
    setMessage("Consentimiento revocado.");
  }

  return (
    <Card className="space-y-3 text-sm text-calm-800">
      <p>
        Autorizas compartir tu ficha de autoevaluación <strong className="font-medium">orientativa</strong> con
        este profesional. No es un diagnóstico clínico.
      </p>
      {message ? <Alert variant={status === "error" ? "error" : "success"}>{message}</Alert> : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" disabled={status === "loading" || status === "success"} onClick={() => void grant()}>
          Compartir ficha
        </Button>
        <Button type="button" disabled={status === "loading"} onClick={() => void revoke()}>
          Revocar
        </Button>
      </div>
    </Card>
  );
}