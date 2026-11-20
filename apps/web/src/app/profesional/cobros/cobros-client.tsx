"use client";

import { useCallback, useEffect, useState } from "react";

import { Alert, Button, Card } from "@telehealth/ui";

type Earning = {
  paymentId: string;
  patientName: string;
  scheduledAt: string;
  grossCents: number;
  commissionCents: number | null;
  netCents: number | null;
  currency: string;
  settlementStatus: string;
};

type Settlement = {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  grossCents: number;
  commissionCents: number;
  netCents: number;
  currency: string;
  failureMessage: string | null;
};

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency }).format(cents / 100);
}

export function CobrosClient() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const res = await fetch(`/api/professional/earnings?${qs.toString()}`);
    const data = (await res.json()) as {
      earnings?: Earning[];
      settlements?: Settlement[];
      message?: string;
    };
    if (!res.ok) {
      setError(data.message ?? "No pudimos cargar los cobros.");
      setLoading(false);
      return;
    }
    setError(null);
    setEarnings(data.earnings ?? []);
    setSettlements(data.settlements ?? []);
    setLoading(false);
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  async function retrySettlement(id: string) {
    await fetch(`/api/professional/settlements/${id}/retry`, { method: "POST" });
    await load();
  }

  if (loading) return <p className="text-sm text-calm-800">Cargando cobros…</p>;

  if (error) {
    return (
      <div className="space-y-3">
        <Alert variant="error">{error}</Alert>
        <Button type="button" onClick={() => void load()}>
          Reintentar
        </Button>
      </div>
    );
  }

  const empty = earnings.length === 0 && settlements.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <label className="text-sm">
          Desde
          <input
            type="date"
            className="ml-2 rounded border border-calm-200 px-2 py-1"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Hasta
          <input
            type="date"
            className="ml-2 rounded border border-calm-200 px-2 py-1"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <Button type="button" onClick={() => void load()}>
          Filtrar
        </Button>
      </div>

      {empty ? (
        <Alert variant="info">Todavía no tenés cobros registrados en este período.</Alert>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-calm-900">Sesiones cobradas</h2>
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-calm-200 text-calm-800">
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">Paciente</th>
                <th className="py-2 pr-4">Bruto</th>
                <th className="py-2 pr-4">Comisión</th>
                <th className="py-2 pr-4">Neto</th>
                <th className="py-2">Liquidación</th>
              </tr>
            </thead>
            <tbody>
              {earnings.map((e) => (
                <tr key={e.paymentId} className="border-b border-calm-100">
                  <td className="py-2 pr-4">
                    {new Date(e.scheduledAt).toLocaleDateString("es-AR")}
                  </td>
                  <td className="py-2 pr-4">{e.patientName}</td>
                  <td className="py-2 pr-4">{money(e.grossCents, e.currency)}</td>
                  <td className="py-2 pr-4">
                    {e.commissionCents !== null ? money(e.commissionCents, e.currency) : "—"}
                  </td>
                  <td className="py-2 pr-4">
                    {e.netCents !== null ? money(e.netCents, e.currency) : "—"}
                  </td>
                  <td className="py-2">{e.settlementStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="space-y-2 md:hidden">
          {earnings.map((e) => (
            <li key={e.paymentId}>
              <Card className="space-y-1 p-3 text-sm">
                <p className="font-medium text-calm-900">{e.patientName}</p>
                <p className="text-calm-800">{new Date(e.scheduledAt).toLocaleString("es-AR")}</p>
                <p>Bruto {money(e.grossCents, e.currency)}</p>
                <p>Neto {e.netCents !== null ? money(e.netCents, e.currency) : "—"}</p>
                <p className="text-xs text-calm-700">Liquidación: {e.settlementStatus}</p>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-calm-900">Historial de liquidaciones</h2>
        <ul className="space-y-3">
          {settlements.map((s) => (
            <li key={s.id}>
              <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium text-calm-900">
                    {s.periodStart.slice(0, 10)} — {s.periodEnd.slice(0, 10)}
                  </p>
                  <p className="text-sm text-calm-800">
                    Neto {money(s.netCents, s.currency)} · {s.status}
                  </p>
                  {s.status === "failed" && s.failureMessage ? (
                    <Alert variant="error">{s.failureMessage}</Alert>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/api/professional/settlements/${s.id}/receipt`}
                    className="text-sm font-medium text-calm-800 underline"
                  >
                    PDF
                  </a>
                  {s.status === "failed" ? (
                    <Button type="button" onClick={() => void retrySettlement(s.id)}>
                      Reintentar
                    </Button>
                  ) : null}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
