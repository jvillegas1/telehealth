"use client";

import { useEffect, useState } from "react";

import { Alert, Button, Card } from "@telehealth/ui";

type Props = {
  appointmentId: string;
  patientLabel: string;
  hasIntakeConsent: boolean;
  sessionHref: string;
};

export function ProfessionalControlClient({
  appointmentId,
  patientLabel,
  hasIntakeConsent,
  sessionHref,
}: Props) {
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [recordingState, setRecordingState] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`/api/sessions/${appointmentId}/notes`)
      .then((r) => r.json())
      .then((d: { notes?: string }) => setNotes(d.notes ?? ""));
  }, [appointmentId]);

  async function saveNotes() {
    const res = await fetch(`/api/sessions/${appointmentId}/notes`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    const data = (await res.json()) as { message?: string };
    setMessage(res.ok ? "Notas guardadas (cifradas)." : (data.message ?? "Error"));
  }

  async function recordingAction(body: { granted: boolean; requestEnable?: boolean }) {
    const res = await fetch(`/api/sessions/${appointmentId}/recording`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { recordingEnabled?: boolean; message?: string };
    setRecordingState(
      res.ok
        ? data.recordingEnabled
          ? "Grabación activa (doble consentimiento)."
          : "Consentimiento registrado; falta la otra parte."
        : (data.message ?? "Error"),
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-4 px-4 py-6 md:grid-cols-2">
      <div className="space-y-4 md:sticky md:top-4 md:self-start">
        <h1 className="text-xl font-semibold text-calm-900">Control de sesión</h1>
        <p className="text-sm text-calm-800">Paciente: {patientLabel}</p>
        <a
          href={sessionHref}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-calm-800 px-4 py-2 text-sm font-medium text-white md:w-auto"
        >
          Abrir videollamada
        </a>
        <Card className="p-4 md:hidden">
          <p className="text-sm text-calm-800">Deslizá hacia arriba para notas y ficha.</p>
        </Card>
      </div>

      <div className="space-y-4 rounded-t-2xl border border-calm-200 bg-white p-4 shadow-lg md:rounded-lg md:shadow-none">
        {message ? <Alert variant="info">{message}</Alert> : null}
        {!hasIntakeConsent ? (
          <Alert variant="info">El paciente aún no compartió la ficha de autoevaluación.</Alert>
        ) : (
          <Alert variant="info">Consentimiento de ficha vigente.</Alert>
        )}

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-calm-900">Notas clínicas (cifradas)</h2>
          <textarea
            className="min-h-40 w-full rounded-md border border-calm-200 p-2 text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button type="button" onClick={() => void saveNotes()}>
            Guardar notas
          </Button>
        </section>

        <section className="space-y-2 border-t border-calm-100 pt-4">
          <h2 className="text-sm font-semibold text-calm-900">
            Grabación (desactivada por defecto)
          </h2>
          <p className="text-xs text-calm-700">
            Requiere consentimiento explícito del paciente y del profesional.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void recordingAction({ granted: true, requestEnable: true })}
            >
              Solicitar grabación
            </Button>
            <Button type="button" onClick={() => void recordingAction({ granted: true })}>
              Confirmar mi consentimiento
            </Button>
          </div>
          {recordingState ? <p className="text-sm text-calm-800">{recordingState}</p> : null}
        </section>
      </div>
    </div>
  );
}
