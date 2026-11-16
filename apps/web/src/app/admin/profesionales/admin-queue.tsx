"use client";

import { useEffect, useState } from "react";

import { Button, Card } from "@telehealth/ui";

type QueueItem = {
  profile: { id: string; displayName: string; status: string };
  credentialId: string;
  licenseNumber: string;
  issuingBody: string;
};

export function AdminProfessionalQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/professionals");
    const data = (await res.json()) as { queue?: QueueItem[] };
    setQueue(data.queue ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function decide(item: QueueItem, decision: "approve" | "reject") {
    const res = await fetch("/api/admin/professionals", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        profileId: item.profile.id,
        credentialId: item.credentialId,
        decision,
      }),
    });
    const data = (await res.json()) as { message?: string };
    setMessage(data.message ?? "Actualizado.");
    await load();
  }

  return (
    <div className="space-y-4">
      {message ? <p className="text-sm text-calm-800">{message}</p> : null}
      {queue.length === 0 ? (
        <p className="text-sm text-calm-800">No hay perfiles en revisión.</p>
      ) : (
        <ul className="space-y-3">
          {queue.map((item) => (
            <li key={item.credentialId}>
              <Card className="space-y-2 p-4">
                <p className="font-medium text-calm-900">{item.profile.displayName}</p>
                <p className="text-sm text-calm-800">
                  {item.issuingBody} — {item.licenseNumber}
                </p>
                <div className="flex gap-2">
                  <Button type="button" onClick={() => decide(item, "approve")}>
                    Aprobar
                  </Button>
                  <Button type="button" onClick={() => decide(item, "reject")}>
                    Rechazar
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}