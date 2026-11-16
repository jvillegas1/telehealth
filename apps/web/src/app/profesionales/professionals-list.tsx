"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { PROFESSIONAL_SPECIALTIES, SPECIALTY_LABELS, specialtyLabel } from "@telehealth/domain";
import { Button, EmptyProfessionalsState, ProfessionalCard } from "@telehealth/ui";

export type ListedProfessional = {
  id: string;
  displayName: string;
  specialties: string[];
  therapeuticApproach: string | null;
  languages: string[];
  feeCents: number | null;
  currency: string | null;
  nextAvailabilityAt: string | null;
  photoUrl: string | null;
  photoAlt: string | null;
  score: number;
  reasons: string[];
};

type Props = {
  items: ListedProfessional[];
  countries: { id: string; name: string }[];
  filters: {
    specialty?: string;
    language?: string;
    countryId?: string;
    minFee?: string;
    maxFee?: string;
    week?: string;
    page?: string;
    intake?: string;
  };
  hasMore: boolean;
  error?: string;
};

export function ProfessionalsList({ items, countries, filters, hasMore, error }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onFilterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    for (const [key, value] of data.entries()) {
      if (typeof value === "string" && value) {
        params.set(key, value);
      }
    }
    if (filters.intake) {
      params.set("intake", filters.intake);
    }
    start(() => router.push(`/profesionales?${params.toString()}`));
  }

  if (error) {
    return (
      <EmptyProfessionalsState
        title="No pudimos cargar el listado"
        description={error}
        primaryAction={{ label: "Reintentar", href: "/profesionales" }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onFilterSubmit} className="grid gap-3 rounded-lg border border-calm-100 bg-white p-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="text-calm-800">Especialidad</span>
          <select name="specialty" defaultValue={filters.specialty ?? ""} className="mt-1 w-full rounded border border-calm-100 p-2">
            <option value="">Todas</option>
            {PROFESSIONAL_SPECIALTIES.map((s) => (
              <option key={s} value={s}>
                {SPECIALTY_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="text-calm-800">Idioma</span>
          <select name="language" defaultValue={filters.language ?? ""} className="mt-1 w-full rounded border border-calm-100 p-2">
            <option value="">Todos</option>
            <option value="es">Español</option>
            <option value="en">Inglés</option>
            <option value="pt">Portugués</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="text-calm-800">País</span>
          <select name="countryId" defaultValue={filters.countryId ?? ""} className="mt-1 w-full rounded border border-calm-100 p-2">
            <option value="">Todos</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-calm-800">
          <input type="checkbox" name="week" value="1" defaultChecked={filters.week === "1"} />
          Disponible esta semana
        </label>
        <label className="text-sm">
          <span className="text-calm-800">Precio mínimo (centavos)</span>
          <input name="minFee" defaultValue={filters.minFee ?? ""} className="mt-1 w-full rounded border border-calm-100 p-2" inputMode="numeric" />
        </label>
        <label className="text-sm">
          <span className="text-calm-800">Precio máximo (centavos)</span>
          <input name="maxFee" defaultValue={filters.maxFee ?? ""} className="mt-1 w-full rounded border border-calm-100 p-2" inputMode="numeric" />
        </label>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Aplicando…" : "Aplicar filtros"}
          </Button>
        </div>
      </form>

      {items.length === 0 ? (
        <EmptyProfessionalsState
          description="Probá ampliar los filtros o realizá la autoevaluación para ver sugerencias más alineadas."
          primaryAction={{ label: "Ver todos los filtros", href: "/profesionales" }}
          secondaryAction={
            <Link href="/autoevaluacion" className="text-sm font-medium underline">
              Volver a autoevaluación
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3" role="list">
          {items.map((pro) => (
            <li key={pro.id}>
              <ProfessionalCard
                id={pro.id}
                name={pro.displayName}
                specialties={pro.specialties.map((s) => specialtyLabel(s))}
                approach={pro.therapeuticApproach}
                languages={pro.languages}
                feeLabel={
                  pro.feeCents && pro.currency
                    ? `${(pro.feeCents / 100).toLocaleString("es-AR")} ${pro.currency}`
                    : null
                }
                photoUrl={pro.photoUrl}
                photoAlt={pro.photoAlt}
                availabilityLabel={
                  pro.nextAvailabilityAt
                    ? `Próximo turno: ${new Date(pro.nextAvailabilityAt).toLocaleDateString("es-AR")}`
                    : "Consultá disponibilidad en el perfil"
                }
                reasons={pro.reasons}
                href={`/profesionales/${pro.id}`}
                footer={
                  <Link
                    href={`/profesionales/${pro.id}/consentimiento${filters.intake ? `?intake=${filters.intake}` : ""}`}
                    className="mt-2 inline-block text-sm font-medium text-calm-900 underline"
                  >
                    Seleccionar y consentimiento
                  </Link>
                }
              />
            </li>
          ))}
        </ul>
      )}

      {hasMore ? (
        <form action="/profesionales" method="get" className="text-center">
          {Object.entries(filters).map(([k, v]) =>
            v ? <input key={k} type="hidden" name={k} value={v} /> : null,
          )}
          <input type="hidden" name="page" value={String(Number(filters.page ?? "0") + 1)} />
          <Button type="submit">Cargar más</Button>
        </form>
      ) : null}
    </div>
  );
}