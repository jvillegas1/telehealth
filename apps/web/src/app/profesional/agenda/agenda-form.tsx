"use client";

import { useEffect, useState } from "react";

import { Alert, Button } from "@telehealth/ui";

const DAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
];

type Rule = { dayOfWeek: number; startTime: string; endTime: string };

export function AgendaForm() {
  const [rules, setRules] = useState<Rule[]>([
    { dayOfWeek: 1, startTime: "09:00", endTime: "13:00" },
    { dayOfWeek: 3, startTime: "14:00", endTime: "18:00" },
  ]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/professional/availability/rules");
      const data = (await res.json()) as { rules?: Rule[] };
      if (data.rules?.length) setRules(data.rules);
    })();
  }, []);

  async function save() {
    const res = await fetch("/api/professional/availability/rules", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rules }),
    });
    const data = (await res.json()) as { message?: string };
    setMessage(data.message ?? (res.ok ? "Guardado." : "Error"));
  }

  return (
    <div className="space-y-4">
      {message ? <Alert variant="info">{message}</Alert> : null}
      <p className="text-sm text-calm-800 md:hidden">
        Lista por día — configurá cada bloque horario.
      </p>
      <div className="hidden md:block rounded-lg border border-calm-100 p-4 text-sm text-calm-800">
        Vista semanal: los bloques se repiten cada semana en tu zona horaria.
      </div>
      <ul className="space-y-3">
        {rules.map((rule, index) => (
          <li
            key={`${rule.dayOfWeek}-${index}`}
            className="grid gap-2 rounded-lg border border-calm-100 p-3 sm:grid-cols-3"
          >
            <select
              className="rounded border border-calm-100 p-2 text-sm"
              value={rule.dayOfWeek}
              onChange={(e) => {
                const next = [...rules];
                next[index] = { ...rule, dayOfWeek: Number(e.target.value) };
                setRules(next);
              }}
            >
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <input
              type="time"
              className="rounded border border-calm-100 p-2 text-sm"
              value={rule.startTime.slice(0, 5)}
              onChange={(e) => {
                const next = [...rules];
                next[index] = { ...rule, startTime: e.target.value };
                setRules(next);
              }}
            />
            <input
              type="time"
              className="rounded border border-calm-100 p-2 text-sm"
              value={rule.endTime.slice(0, 5)}
              onChange={(e) => {
                const next = [...rules];
                next[index] = { ...rule, endTime: e.target.value };
                setRules(next);
              }}
            />
          </li>
        ))}
      </ul>
      <Button type="button" onClick={() => void save()}>
        Guardar disponibilidad
      </Button>
    </div>
  );
}
