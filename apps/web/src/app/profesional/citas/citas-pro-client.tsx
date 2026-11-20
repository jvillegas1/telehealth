"use client";

import { useEffect, useState } from "react";

import { Alert, Button, Card } from "@telehealth/ui";

type Row = {
  id: string;
  status: string;
  scheduledAt: string;
  patientName: string;
  currency: string;
  grossCents: number;
  commissionCents: number | null;
  netCents: number | null;
  commissionSummary: string | null;
};

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency }).format(cents / 100);
}

export function CitasProClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/professional/appointments");
    const data = (await res.json()) as { appointments?: Row[]; message?: string };
    if (!res.ok) setError(data.message ?? "Error al cargar.");
    else {
      setError(null);
      setRows(data.appointments ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(id: string, action: "accept" | "reject") {
    const res = await fetch(`/api/professional/appointments/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = (await res.json()) as { message?: string };
    setMessage(
      res.ok
        ? action === "accept"
          ? "Cita aceptada."
          : "Cita rechazada."
        : (data.message ?? "Error"),
    );
    await load();
  }

  if (loading) return <p className="text-sm text-calm-800">Cargando citas…</p>;

  return (
    <div className="space-y-4">
      {error ? <Alert variant="error">{error}</Alert> : null}
      {message ? <Alert variant="info">{message}</Alert> : null}
      {rows.length === 0 ? (
        <p className="text-sm text-calm-800">No hay citas pendientes ni confirmadas.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id}>
              <Card className="space-y-3 p-4">
                <div>
                  <p className="font-medium text-calm-900">{row.patientName}</p>
                  <p className="text-sm text-calm-800">
                    {new Date(row.scheduledAt).toLocaleString("es-AR")} — {row.status}
                  </p>
                </div>
                {row.status === "pending" &&
                row.commissionCents !== null &&
                row.netCents !== null ? (
                  <div className="rounded-md bg-calm-50 p-3 text-sm text-calm-900">
                    <p className="font-medium">Cobro transparente (antes de aceptar)</p>
                    <ul className="mt-2 space-y-1">
                      <li>Bruto: {money(row.grossCents, row.currency)}</li>
                      <li>Comisión: {money(row.commissionCents, row.currency)}</li>
                      <li className="font-semibold">
                        Neto para vos: {money(row.netCents, row.currency)}
                      </li>
                    </ul>
                    {row.commissionSummary ? (
                      <p className="mt-2 text-xs text-calm-700">{row.commissionSummary}</p>
                    ) : null}
                  </div>
                ) : null}
                {row.status === "pending" ? (
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={() => void act(row.id, "accept")}>
                      Aceptar cita
                    </Button>
                    <Button type="button" onClick={() => void act(row.id, "reject")}>
                      Rechazar
                    </Button>
                  </div>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
