"use client";

import { useEffect, useState } from "react";

import { Button } from "@telehealth/ui";

type CountryRow = {
  id: string;
  code: string;
  name: string;
  paymentGateway: string | null;
  active: boolean;
};

export function AdminCountriesClient() {
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = () => {
    void fetch("/api/admin/countries")
      .then((r) => r.json())
      .then((d: { countries?: CountryRow[] }) => setCountries(d.countries ?? []));
  };

  useEffect(load, []);

  async function toggleActive(country: CountryRow) {
    setPendingId(country.id);
    await fetch("/api/admin/countries", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ countryId: country.id, active: !country.active }),
    });
    setPendingId(null);
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Países y comisiones</h1>
      <p className="text-sm text-calm-700">
        Un país inactivo no permite registro, listado ni reservas (REQ-SEC-05).
      </p>
      <ul className="space-y-2 text-sm">
        {countries.map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded border p-3"
          >
            <span>
              {c.name} ({c.code}) — pasarela: {c.paymentGateway ?? "—"} —{" "}
              <strong>{c.active ? "activo" : "inactivo"}</strong>
            </span>
            <Button
              type="button"
              disabled={pendingId === c.id}
              onClick={() => void toggleActive(c)}
            >
              {c.active ? "Desactivar país" : "Activar (tras revisión legal)"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
