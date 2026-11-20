"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Alert, Button, Card } from "@telehealth/ui";

type Props = {
  appointmentId: string;
  professionalName: string;
  joinHref: string;
};

export function WaitingRoomClient({ appointmentId, professionalName, joinHref }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const checkToken = useCallback(async () => {
    const res = await fetch(`/api/sessions/${appointmentId}/token`);
    const data = (await res.json()) as { message?: string };
    if (!res.ok) {
      setTokenError(data.message ?? "No podés ingresar aún.");
      setReady(false);
      return;
    }
    setTokenError(null);
    setReady(true);
  }, [appointmentId]);

  useEffect(() => {
    void checkToken();
    const id = window.setInterval(() => void checkToken(), 30_000);
    return () => window.clearInterval(id);
  }, [checkToken]);

  useEffect(() => {
    let stream: MediaStream | undefined;
    async function startPreview() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setMediaError(null);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setMediaError(
          "No pudimos acceder a cámara o micrófono. Podés unirte en modo solo audio desde la llamada.",
        );
      }
    }
    void startPreview();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-8">
      <h1 className="text-xl font-semibold text-calm-900">Sala de espera</h1>
      <p className="text-sm text-calm-800">Sesión con {professionalName}</p>

      {tokenError ? <Alert variant="error">{tokenError}</Alert> : null}
      {mediaError ? <Alert variant="info">{mediaError}</Alert> : null}

      <Card className="overflow-hidden bg-calm-950 p-0">
        <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
      </Card>

      {ready ? (
        <a
          href={joinHref}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-calm-800 px-4 py-2 text-center text-sm font-medium text-white hover:bg-calm-900"
        >
          Ingresar a la videollamada
        </a>
      ) : (
        <Button type="button" disabled className="w-full" aria-label="Esperando ventana de la cita">
          Esperando ventana de la cita…
        </Button>
      )}
    </div>
  );
}
