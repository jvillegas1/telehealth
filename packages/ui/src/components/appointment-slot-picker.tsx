"use client";

import { cn } from "../lib/cn";
import { Button } from "./button";

export type SlotOption = {
  startUtc: string;
  endUtc: string;
  label: string;
};

export function AppointmentSlotPicker(props: {
  slots: SlotOption[];
  patientTimeZone: string;
  selectedStartUtc?: string;
  loading?: boolean;
  error?: string | null;
  onSelect: (startUtc: string, endUtc: string) => void;
}) {
  if (props.loading) {
    return (
      <p className="text-sm text-calm-800" role="status">
        Cargando horarios disponibles…
      </p>
    );
  }

  if (props.error) {
    return <p className="text-sm text-red-800">{props.error}</p>;
  }

  if (props.slots.length === 0) {
    return (
      <div className="space-y-2 rounded-lg border border-calm-100 p-4 text-sm text-calm-800">
        <p>No hay turnos libres en las próximas semanas.</p>
        <p>Probá otro profesional o volvé más tarde.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-calm-800">Horarios en tu zona ({props.patientTimeZone})</p>
      <ul className="grid gap-2 sm:grid-cols-2" role="listbox" aria-label="Franjas disponibles">
        {props.slots.map((slot) => {
          const selected = props.selectedStartUtc === slot.startUtc;
          return (
            <li key={slot.startUtc}>
              <Button
                type="button"
                className={cn(
                  "w-full justify-start bg-white text-calm-900 ring-1 ring-calm-100 hover:bg-calm-50",
                  selected && "ring-2 ring-calm-800",
                )}
                aria-selected={selected}
                onClick={() => props.onSelect(slot.startUtc, slot.endUtc)}
              >
                {slot.label}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
