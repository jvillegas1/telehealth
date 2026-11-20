"use client";

import { useEffect, useState } from "react";

import { Button } from "@telehealth/ui";

type Grant = {
  id: string;
  resourceType: string;
  resourceId: string;
  status: string;
  reason: string;
};

export function AdminSensitiveClient() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [resourceType, setResourceType] = useState("intake_forms");
  const [resourceId, setResourceId] = useState("");
  const [reason, setReason] = useState("");

  async function load() {
    const res = await fetch("/api/admin/sensitive-access");
    const data = (await res.json()) as { grants?: Grant[] };
    setGrants(data.grants ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function requestGrant() {
    await fetch("/api/admin/sensitive-access", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ resourceType, resourceId, reason }),
    });
    await load();
  }

  async function decide(grantId: string, decision: "approved" | "denied") {
    await fetch("/api/admin/sensitive-access", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ grantId, decision }),
    });
    await load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Acceso sensible</h1>
      <div className="grid gap-2 text-sm md:grid-cols-2">
        <input
          className="rounded border p-2"
          placeholder="resource_type"
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
        />
        <input
          className="rounded border p-2"
          placeholder="resource_id (uuid)"
          value={resourceId}
          onChange={(e) => setResourceId(e.target.value)}
        />
        <textarea
          className="col-span-2 rounded border p-2"
          placeholder="Motivo escrito (mín. 20)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <Button type="button" onClick={() => void requestGrant()}>
          Solicitar acceso
        </Button>
      </div>
      <ul className="space-y-2 text-sm">
        {grants.map((g) => (
          <li key={g.id} className="rounded border p-3">
            {g.status} — {g.resourceType} — {g.reason}
            {g.status === "pending" ? (
              <div className="mt-2 flex gap-2">
                <Button type="button" onClick={() => void decide(g.id, "approved")}>
                  Aprobar
                </Button>
                <Button type="button" onClick={() => void decide(g.id, "denied")}>
                  Denegar
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
