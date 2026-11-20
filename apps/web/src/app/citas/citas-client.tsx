"use client";

import { useEffect, useState } from "react";

import { Alert, Button, Card } from "@telehealth/ui";

type AppointmentRow = {
  id: string;
  professionalName: string;
  status: string;
  scheduledAt: string;
  scheduledEndAt: string;
  professionalProfileId: string;
};

export function CitasClient() {
  const [items, setItems] = useState<AppointmentRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/appointments");
    const data = (await res.json()) as { appointments?: AppointmentRow[]; message?: string };
    if (!res.ok) {
      setError(data.message ?? "No pudimos cargar tus citas.");
      return;
    }
    setItems(data.appointments ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function cancel(id: string) {
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    const data = (await res.json()) as { message?: string };
    setMessage(data.message ?? (res.ok ? "Cancelada." : "Error"));
    await load();
  }

  return (
    <div className="space-y-4">
      {error ? <Alert variant="error">{error}</Alert> : null}
      {message ? <Alert variant="info">{message}</Alert> : null}

      {items.length === 0 ? (
        <p className="text-sm text-calm-800">No tenés citas programadas.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Card className="space-y-2 p-4">
                <p className="font-medium text-calm-900">{item.professionalName}</p>
                <p className="text-sm text-calm-800">
                  {new Date(item.scheduledAt).toLocaleString("es-AR")} — {item.status}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(item.status === "pending" || item.status === "confirmed") && (
                    <>
                      <a href={`/sesion/${item.id}/espera`}>
                        <Button type="button">Ir a la sesión</Button>
                      </a>
                      <a href={`/profesionales/${item.professionalProfileId}/reservar`}>
                        <Button type="button">Reprogramar</Button>
                      </a>
                      <Button type="button" onClick={() => void cancel(item.id)}>
                        Cancelar
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
