import Image from "next/image";
import Link from "next/link";
import { and, avg, count, eq } from "drizzle-orm";

import { createDb } from "@telehealth/db";
import { credentials, professionalReviews } from "@telehealth/db/schema";
import { specialtyLabel } from "@telehealth/domain";
import { Alert, Card } from "@telehealth/ui";

import { getServerEnv } from "@/env.server";
import { getPublicProfessionalById } from "@/server/professionals/list";

export default async function ProfesionalPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;

  if (!url) {
    return <p className="p-4 text-sm">Servicio no disponible.</p>;
  }

  const db = createDb(url);
  const pro = await getPublicProfessionalById(db, id);

  if (!pro) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <Alert variant="error">Este profesional no está disponible en el directorio.</Alert>
      </main>
    );
  }

  const [credential] = await db
    .select({
      licenseNumber: credentials.licenseNumber,
      issuingBody: credentials.issuingBody,
    })
    .from(credentials)
    .where(and(eq(credentials.professionalProfileId, id), eq(credentials.status, "verified")))
    .limit(1);

  const [reviewAgg] = await db
    .select({ avg: avg(professionalReviews.rating), total: count() })
    .from(professionalReviews)
    .where(
      and(
        eq(professionalReviews.professionalProfileId, id),
        eq(professionalReviews.moderationStatus, "visible"),
      ),
    );

  const alt = pro.photoAlt?.trim() || `Foto de perfil de ${pro.displayName}`;

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-4 px-4 py-10">
      <div className="flex items-start gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-full bg-calm-100">
          {pro.photoUrl ? (
            <Image
              src={pro.photoUrl}
              alt={alt}
              fill
              sizes="80px"
              className="object-cover"
              priority
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xl font-semibold text-calm-800">
              {pro.displayName.slice(0, 1)}
            </span>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-calm-900">{pro.displayName}</h1>
          <p className="text-sm text-calm-800">{pro.countryName ?? "—"}</p>
        </div>
      </div>

      {credential ? (
        <Alert variant="info">Credencial verificada ({credential.issuingBody})</Alert>
      ) : null}

      <Card className="space-y-2 text-sm text-calm-800">
        <p>{pro.bio ?? "Sin descripción."}</p>
        <p>
          <strong className="text-calm-900">Especialidades:</strong>{" "}
          {pro.specialties.map((s) => specialtyLabel(s)).join(", ") || "—"}
        </p>
        {pro.therapeuticApproach ? (
          <p>
            <strong className="text-calm-900">Enfoque:</strong> {pro.therapeuticApproach}
          </p>
        ) : null}
        <p>
          <strong className="text-calm-900">Idiomas:</strong> {pro.languages.join(", ") || "—"}
        </p>
        {pro.feeCents && pro.currency ? (
          <p>
            <strong className="text-calm-900">Honorarios desde:</strong>{" "}
            {(pro.feeCents / 100).toLocaleString("es-AR")} {pro.currency}
          </p>
        ) : null}
        <p>
          <strong className="text-calm-900">Disponibilidad:</strong>{" "}
          {pro.nextAvailabilityAt
            ? `Próximo hueco ${pro.nextAvailabilityAt.toLocaleDateString("es-AR")}`
            : "Consultá al reservar"}
        </p>
        {reviewAgg?.total ? (
          <p>
            <strong className="text-calm-900">Valoración:</strong>{" "}
            {Number(reviewAgg.avg).toFixed(1)} / 5 ({reviewAgg.total} opiniones)
          </p>
        ) : (
          <p className="text-xs">Aún no hay valoraciones públicas.</p>
        )}
      </Card>

      <div className="flex flex-col gap-2">
        <Link
          href={`/profesionales/${id}/reservar`}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-calm-800 px-4 text-sm font-medium text-white"
        >
          Reservar turno
        </Link>
        <Link
          href={`/profesionales/${id}/consentimiento`}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-calm-200 px-4 text-sm font-medium text-calm-900"
        >
          Consentimiento para compartir ficha
        </Link>
      </div>
    </main>
  );
}
