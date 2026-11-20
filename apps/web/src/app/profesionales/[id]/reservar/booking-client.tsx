"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppointmentSlotPicker, Alert, Button, type SlotOption } from "@telehealth/ui";

type Policy = {
  version: number;
  summary: string;
};

export function BookingClient({
  professionalId,
  professionalName,
}: {
  professionalId: string;
  professionalName: string;
}) {
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [patientTz, setPatientTz] = useState("America/Argentina/Buenos_Aires");
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [selected, setSelected] = useState<{ start: string; end: string } | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const [slotsRes, policyRes] = await Promise.all([
        fetch(`/api/professionals/${professionalId}/slots`),
        fetch("/api/cancellation-policy"),
      ]);
      const slotsJson = (await slotsRes.json()) as {
        slots?: SlotOption[];
        patientTimeZone?: string;
        message?: string;
      };
      const policyJson = (await policyRes.json()) as { policy?: Policy };
      if (!slotsRes.ok) {
        setError(slotsJson.message ?? "Error al cargar horarios.");
      } else {
        setSlots(slotsJson.slots ?? []);
        if (slotsJson.patientTimeZone) setPatientTz(slotsJson.patientTimeZone);
      }
      setPolicy(policyJson.policy ?? null);
      setLoading(false);
    })();
  }, [professionalId]);

  async function confirmBooking() {
    if (!selected || !policy || !accepted) return;
    setConflict(null);
    setMessage(null);
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        professionalProfileId: professionalId,
        scheduledAt: selected.start,
        scheduledEndAt: selected.end,
        policyVersion: policy.version,
        policyAccepted: true,
      }),
    });
    const data = (await res.json()) as { message?: string; appointmentId?: string };
    if (res.status === 409) {
      setConflict(data.message ?? "Conflicto de reserva.");
      return;
    }
    if (!res.ok) {
      setError(data.message ?? "No se pudo reservar.");
      return;
    }
    setMessage("Turno confirmado.");
    window.location.href = "/citas";
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-calm-900">Reservar con {professionalName}</h1>

      {policy ? (
        <Alert variant="info">
          <p className="font-medium">Política de cancelación</p>
          <p className="mt-1 text-sm">{policy.summary}</p>
          <label className="mt-3 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            Leí y acepto la política antes de confirmar la reserva.
          </label>
        </Alert>
      ) : null}

      {conflict ? <Alert variant="error">{conflict}</Alert> : null}
      {message ? <Alert variant="info">{message}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}

      <AppointmentSlotPicker
        slots={slots}
        patientTimeZone={patientTz}
        loading={loading}
        {...(error ? { error } : {})}
        {...(selected?.start ? { selectedStartUtc: selected.start } : {})}
        onSelect={(start, end) => setSelected({ start, end })}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={!selected || !accepted}
          onClick={() => void confirmBooking()}
        >
          Confirmar reserva
        </Button>
        <Link href={`/profesionales/${professionalId}`} className="text-sm underline">
          Volver al perfil
        </Link>
      </div>
    </div>
  );
}
