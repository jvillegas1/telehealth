import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { Card } from "./card";

export type ProfessionalCardProps = {
  id: string;
  name: string;
  specialties: string[];
  approach?: string | null;
  languages?: string[];
  feeLabel?: string | null;
  photoUrl?: string | null;
  photoAlt?: string | null;
  availabilityLabel?: string | null;
  reasons?: string[];
  href: string;
  className?: string;
  footer?: ReactNode;
};

export function ProfessionalCard({
  id,
  name,
  specialties,
  approach,
  languages,
  feeLabel,
  photoUrl,
  photoAlt,
  availabilityLabel,
  reasons,
  href,
  className,
  footer,
}: ProfessionalCardProps) {
  const alt = photoAlt?.trim() || `Foto de perfil de ${name}`;

  return (
    <Card className={cn("flex gap-3 p-4", className)} data-professional-id={id}>
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-calm-100">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- paquete UI sin dependencia de next/image
          <img src={photoUrl} alt={alt} width={64} height={64} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-lg font-medium text-calm-800" aria-hidden>
            {name.slice(0, 1)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <h2 className="text-base font-semibold text-calm-900">
          <a href={href} className="hover:underline">
            {name}
          </a>
        </h2>
        {specialties.length > 0 ? (
          <p className="text-xs text-calm-800">{specialties.join(" · ")}</p>
        ) : null}
        {approach ? <p className="text-xs text-calm-800">{approach}</p> : null}
        {languages && languages.length > 0 ? (
          <p className="text-xs text-calm-800">Idiomas: {languages.join(", ")}</p>
        ) : null}
        {feeLabel ? <p className="text-sm font-medium text-calm-900">{feeLabel}</p> : null}
        {availabilityLabel ? (
          <p className="text-xs text-calm-800" role="status">
            {availabilityLabel}
          </p>
        ) : null}
        {reasons && reasons.length > 0 ? (
          <ul className="mt-2 space-y-0.5 border-t border-calm-100 pt-2 text-xs text-calm-800">
            {reasons.map((reason) => (
              <li key={reason}>• {reason}</li>
            ))}
          </ul>
        ) : null}
        {footer}
      </div>
    </Card>
  );
}