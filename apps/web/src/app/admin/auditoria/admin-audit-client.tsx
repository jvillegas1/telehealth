"use client";

import { useState } from "react";

import { Button } from "@telehealth/ui";

type Entry = {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  createdAt: string;
};

export function AdminAuditClient() {
  const [entries, setEntries] = useState<Entry[]>([]);

  async function load() {
    const res = await fetch("/api/admin/audit-log");
    const data = (await res.json()) as { entries?: Entry[] };
    setEntries(data.entries ?? []);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Auditoría (solo lectura)</h1>
        <Button type="button" onClick={() => void load()}>
          Actualizar
        </Button>
      </div>
      <div className="hidden md:block">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left">Fecha</th>
              <th className="py-2 text-left">Acción</th>
              <th className="py-2 text-left">Tipo</th>
              <th className="py-2 text-left">Recurso</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b">
                <td className="py-1">{e.createdAt}</td>
                <td className="py-1">{e.action}</td>
                <td className="py-1">{e.resourceType}</td>
                <td className="py-1">{e.resourceId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-2 text-sm md:hidden">
        {entries.map((e) => (
          <li key={e.id} className="rounded border p-2">
            {e.action} · {e.resourceType}
          </li>
        ))}
      </ul>
    </div>
  );
}
