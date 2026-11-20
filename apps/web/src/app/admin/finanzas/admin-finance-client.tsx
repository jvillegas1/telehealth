"use client";

import { useEffect, useState } from "react";

import { Button } from "@telehealth/ui";

export function AdminFinanceClient() {
  const [payments, setPayments] = useState<unknown[]>([]);
  const [settlements, setSettlements] = useState<unknown[]>([]);

  useEffect(() => {
    void fetch("/api/admin/payments")
      .then((r) => r.json())
      .then((d: { payments?: unknown[] }) => setPayments(d.payments ?? []));
    void fetch("/api/admin/settlements")
      .then((r) => r.json())
      .then((d: { settlements?: unknown[] }) => setSettlements(d.settlements ?? []));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Finanzas</h1>
        <a href="/api/admin/payments/export">
          <Button type="button">Exportar pagos (CSV)</Button>
        </a>
      </div>
      <section>
        <h2 className="font-medium">Pagos ({payments.length})</h2>
        <p className="text-xs text-calm-700">Exportación sin datos de salud.</p>
      </section>
      <section>
        <h2 className="font-medium">Liquidaciones ({settlements.length})</h2>
      </section>
    </div>
  );
}
