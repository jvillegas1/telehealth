"use client";

import { useEffect, useState } from "react";

import { Alert, Button, Card } from "@telehealth/ui";

type Row = {
  profile: { id: string; displayName: string };
  credentialId: string;
  licenseNumber: string;
  issuingBody: string;
  documentId: string | null;
};

export function AdminCredentialsClient() {
  const [queue, setQueue] = useState<Row[]>([]);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/credentials/queue");
    const data = (await res.json()) as { queue?: Row[]; message?: string };
    setQueue(data.queue ?? []);
    if (!res.ok) setMsg(data.message ?? "Error");
  }

  useEffect(() => {
    void load();
  }, []);

  async function decide(row: Row, decision: "approve" | "reject") {
    const res = await fetch("/api/admin/credentials/queue", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        profileId: row.profile.id,
        credentialId: row.credentialId,
        decision,
        ...(decision === "reject" ? { rejectionReason: reason } : {}),
      }),
    });
    const data = (await res.json()) as { message?: string };
    setMsg(res.ok ? (data.message ?? "Listo.") : (data.message ?? "Error"));
    await load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-calm-900">Verificación de credenciales</h1>
      {msg ? <Alert variant="info">{msg}</Alert> : null}
      <label className="block text-sm">
        Motivo de rechazo (obligatorio al rechazar)
        <textarea
          className="mt-1 w-full rounded border border-calm-200 p-2 text-sm"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <ul className="space-y-3">
        {queue.map((row) => (
          <li key={row.credentialId}>
            <Card className="space-y-2 p-4">
              <p className="font-medium">{row.profile.displayName}</p>
              <p className="text-sm text-calm-800">
                {row.licenseNumber} — {row.issuingBody}
              </p>
              {row.documentId ? (
                <a
                  className="text-sm underline"
                  href={`/api/admin/credentials/${row.credentialId}/document`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver documento
                </a>
              ) : (
                <p className="text-xs text-calm-600">Sin documento adjunto</p>
              )}
              <div className="flex gap-2">
                <Button type="button" onClick={() => void decide(row, "approve")}>
                  Aprobar
                </Button>
                <Button type="button" onClick={() => void decide(row, "reject")}>
                  Rechazar
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
