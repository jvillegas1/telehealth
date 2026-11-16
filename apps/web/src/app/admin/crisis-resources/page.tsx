"use client";

import { useEffect, useState } from "react";

import { Alert, Button, Card } from "@telehealth/ui";

type Resource = {
  id: string;
  title: string;
  description: string;
  contactUri: string;
  active: boolean;
  verifiedAt: string | null;
};

export default function AdminCrisisResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/crisis-resources");
    if (!res.ok) {
      setError("No tienes permiso o el servicio no está disponible.");
      return;
    }
    const data = (await res.json()) as { resources: Resource[] };
    setResources(data.resources);
  }

  async function toggle(id: string, active: boolean) {
    await fetch("/api/admin/crisis-resources", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    await load();
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-10">
      <h1 className="text-2xl font-semibold text-calm-900">Administrar recursos de crisis</h1>
      {error ? <Alert variant="error">{error}</Alert> : null}
      <ul className="space-y-3">
        {resources.map((r) => (
          <Card key={r.id} className="space-y-2 text-sm">
            <p className="font-medium text-calm-900">{r.title}</p>
            <p className="text-calm-800">{r.description}</p>
            <p className="text-calm-800">{r.contactUri}</p>
            <p className="text-xs text-calm-800">
              {r.verifiedAt ? `Verificado: ${new Date(r.verifiedAt).toLocaleString()}` : "Pendiente de verificación"}
            </p>
            <Button type="button" onClick={() => void toggle(r.id, !r.active)}>
              {r.active ? "Desactivar" : "Verificar y activar"}
            </Button>
          </Card>
        ))}
      </ul>
    </main>
  );
}