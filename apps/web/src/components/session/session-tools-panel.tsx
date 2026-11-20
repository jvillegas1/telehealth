"use client";

import { useState } from "react";

import { Button, Card } from "@telehealth/ui";

type Props = {
  appointmentId: string;
  mock: boolean;
};

export function SessionToolsPanel({ appointmentId, mock }: Props) {
  const [breathPhase, setBreathPhase] = useState<"idle" | "inhale" | "exhale">("idle");
  const [whiteboard, setWhiteboard] = useState("");
  const [peerMessage, setPeerMessage] = useState<string | null>(null);

  function sendTool(kind: "breathing" | "whiteboard", payload: Record<string, string>) {
    if (mock) {
      setPeerMessage(`Herramienta ${kind} (local): ${JSON.stringify(payload)}`);
      return;
    }
    void fetch(`/api/sessions/${appointmentId}/token`).then(() => {
      setPeerMessage(`Evento ${kind} enviado por DataChannel (conexión real).`);
    });
  }

  function runBreathing() {
    setBreathPhase("inhale");
    sendTool("breathing", { phase: "inhale", seconds: "4" });
    window.setTimeout(() => {
      setBreathPhase("exhale");
      sendTool("breathing", { phase: "exhale", seconds: "4" });
    }, 4000);
    window.setTimeout(() => setBreathPhase("idle"), 8000);
  }

  return (
    <Card className="space-y-3 p-4">
      <h2 className="text-sm font-semibold text-calm-900">Herramientas compartidas</h2>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={runBreathing}>
          Respiración guiada
        </Button>
        <Button type="button" onClick={() => sendTool("whiteboard", { text: whiteboard })}>
          Compartir pizarra
        </Button>
      </div>
      {breathPhase !== "idle" ? (
        <p className="text-sm text-calm-800">{breathPhase === "inhale" ? "Inhalá…" : "Exhalá…"}</p>
      ) : null}
      <textarea
        className="min-h-24 w-full rounded-md border border-calm-200 p-2 text-sm"
        placeholder="Notas rápidas para la pizarra"
        value={whiteboard}
        onChange={(e) => setWhiteboard(e.target.value)}
      />
      {peerMessage ? <p className="text-xs text-calm-700">{peerMessage}</p> : null}
    </Card>
  );
}
