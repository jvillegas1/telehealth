"use client";

import { useState } from "react";

import { Alert, Button, Input } from "@telehealth/ui";

export function AdminUsersClient() {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<
    { id: string; email: string; role: string; suspendedAt: string | null }[]
  >([]);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function search() {
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`);
    const data = (await res.json()) as { users?: typeof users };
    setUsers(data.users ?? []);
  }

  async function act(userId: string, action: "suspend" | "reactivate") {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, userId, reason }),
    });
    const data = (await res.json()) as { message?: string };
    setMsg(res.ok ? "Actualizado." : (data.message ?? "Error"));
    await search();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Usuarios</h1>
      {msg ? <Alert variant="info">{msg}</Alert> : null}
      <div className="flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar email" />
        <Button type="button" onClick={() => void search()}>
          Buscar
        </Button>
      </div>
      <textarea
        className="w-full rounded border p-2 text-sm"
        placeholder="Motivo (mín. 10 caracteres)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <ul className="space-y-2 text-sm md:hidden">
        {users.map((u) => (
          <li key={u.id} className="rounded border p-3">
            {u.email} · {u.role} {u.suspendedAt ? "· suspendido" : ""}
            <div className="mt-2 flex gap-2">
              <Button type="button" onClick={() => void act(u.id, "suspend")}>
                Suspender
              </Button>
              <Button type="button" onClick={() => void act(u.id, "reactivate")}>
                Reactivar
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left">Email</th>
              <th className="py-2 text-left">Rol</th>
              <th className="py-2 text-left">Estado</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="py-2">{u.email}</td>
                <td className="py-2">{u.role}</td>
                <td className="py-2">{u.suspendedAt ? "Suspendido" : "Activo"}</td>
                <td className="py-2">
                  <Button type="button" onClick={() => void act(u.id, "suspend")}>
                    Suspender
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
