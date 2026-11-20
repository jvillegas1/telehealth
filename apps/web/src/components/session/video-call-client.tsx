"use client";

import { useCallback, useEffect, useState } from "react";

import { Alert, Button, Card } from "@telehealth/ui";

import { SessionToolsPanel } from "./session-tools-panel";

type TokenPayload = {
  token: string;
  livekitUrl: string;
  roomName: string;
  role: "patient" | "professional";
  e2eeEnabled: boolean;
  subtitlesEnabled: boolean;
  recordingEnabled: boolean;
  professionalName: string;
};

type Props = {
  appointmentId: string;
  controlHref?: string;
};

export function VideoCallClient({ appointmentId, controlHref }: Props) {
  const [payload, setPayload] = useState<TokenPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [audioOnly, setAudioOnly] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  const loadToken = useCallback(async () => {
    const res = await fetch(`/api/sessions/${appointmentId}/token`);
    const data = (await res.json()) as TokenPayload & { message?: string };
    if (!res.ok) {
      setError(data.message ?? "No autorizado.");
      return null;
    }
    setError(null);
    setPayload(data);
    return data;
  }, [appointmentId]);

  useEffect(() => {
    void loadToken();
  }, [loadToken]);

  useEffect(() => {
    if (!payload) return;

    let disposed = false;
    let room: import("livekit-client").Room | undefined;

    async function connect() {
      if (!payload) return;
      if (payload.livekitUrl.includes("mock.livekit")) {
        setConnected(true);
        return;
      }

      try {
        const { Room, RoomEvent } = await import("livekit-client");
        room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });

        room.on(RoomEvent.Reconnecting, () => setReconnecting(true));
        room.on(RoomEvent.Reconnected, () => setReconnecting(false));
        room.on(RoomEvent.Disconnected, () => {
          setConnected(false);
          setReconnecting(true);
          window.setTimeout(() => void loadToken().then((t) => t && connect()), 2000);
        });

        await room.connect(payload.livekitUrl, payload.token, {
          autoSubscribe: true,
        });

        try {
          await room.localParticipant.setCameraEnabled(!audioOnly);
          await room.localParticipant.setMicrophoneEnabled(true);
        } catch {
          setAudioOnly(true);
          await room.localParticipant.setCameraEnabled(false);
          await room.localParticipant.setMicrophoneEnabled(true);
        }

        if (!disposed) setConnected(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No pudimos conectar.");
      }
    }

    void connect();

    return () => {
      disposed = true;
      void room?.disconnect();
    };
    // audioOnly toggles re-run connect intentionally when user degrades to voice-only.
  }, [payload, audioOnly, loadToken]);

  async function toggleAudioOnly() {
    setAudioOnly((v) => !v);
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="error">{error}</Alert>
        <Button type="button" className="mt-4" onClick={() => void loadToken()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!payload) {
    return <p className="p-4 text-sm text-calm-800">Conectando…</p>;
  }

  const mock = payload.livekitUrl.includes("mock.livekit");

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-calm-900">Sesión en vivo</h1>
          <p className="text-sm text-calm-800">{payload.professionalName}</p>
        </div>
        {controlHref ? (
          <a href={controlHref} className="text-sm font-medium text-calm-800 underline">
            Panel profesional
          </a>
        ) : null}
      </header>

      {reconnecting ? <Alert variant="info">Reconectando…</Alert> : null}
      {payload.e2eeEnabled ? (
        <Alert variant="info">Conexión cifrada de extremo a extremo activada.</Alert>
      ) : null}

      <Card className="flex aspect-video items-center justify-center bg-calm-950 text-white">
        {mock ? (
          <p className="px-4 text-center text-sm">
            Vista simulada (MOCK_LIVEKIT). Sala <strong>{payload.roomName}</strong>
          </p>
        ) : (
          <p className="text-sm">{connected ? "Videollamada activa" : "Conectando medios…"}</p>
        )}
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void toggleAudioOnly()}>
          {audioOnly ? "Activar cámara" : "Solo audio"}
        </Button>
        <Button type="button" onClick={() => void loadToken()}>
          Refrescar token
        </Button>
      </div>

      <SessionToolsPanel appointmentId={appointmentId} mock={mock} />
    </div>
  );
}
