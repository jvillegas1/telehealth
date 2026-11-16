import { eq } from "drizzle-orm";

import { createDb } from "@telehealth/db";
import { patientProfiles, users } from "@telehealth/db/schema";

import { ProfessionalsList } from "./professionals-list";
import { auth } from "@/auth/auth";
import { getServerEnv } from "@/env.server";
import { fetchCountries, listProfessionalsForPatient } from "@/server/professionals/list";
import { loadSuggestedTagsForPatient } from "@/server/professionals/intake-tags";

const PAGE_SIZE = 12;

export default async function ProfesionalesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  const encryptionKey = "ENCRYPTION_KEY" in env ? env.ENCRYPTION_KEY : undefined;

  if (!session?.user?.id || !url) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <p className="text-sm text-calm-800">Iniciá sesión como paciente para ver profesionales.</p>
      </main>
    );
  }

  const page = Number(typeof sp["page"] === "string" ? sp["page"] : "0");
  const specialty = typeof sp["specialty"] === "string" ? sp["specialty"] : undefined;
  const language = typeof sp["language"] === "string" ? sp["language"] : undefined;
  const countryId = typeof sp["countryId"] === "string" ? sp["countryId"] : undefined;
  const minFeeCents = typeof sp["minFee"] === "string" ? Number(sp["minFee"]) : undefined;
  const maxFeeCents = typeof sp["maxFee"] === "string" ? Number(sp["maxFee"]) : undefined;

  const filters = {
    ...(specialty ? { specialty } : {}),
    ...(language ? { language } : {}),
    ...(countryId ? { countryId } : {}),
    ...(minFeeCents !== undefined && !Number.isNaN(minFeeCents) ? { minFeeCents } : {}),
    ...(maxFeeCents !== undefined && !Number.isNaN(maxFeeCents) ? { maxFeeCents } : {}),
    ...(sp["week"] === "1" ? { availableThisWeek: true } : {}),
    limit: PAGE_SIZE + 1,
    offset: page * PAGE_SIZE,
  };

  const intakeParam = typeof sp["intake"] === "string" ? sp["intake"] : undefined;
  const filterProps = {
    page: String(page),
    ...(specialty ? { specialty } : {}),
    ...(language ? { language } : {}),
    ...(countryId ? { countryId } : {}),
    ...(typeof sp["minFee"] === "string" ? { minFee: sp["minFee"] } : {}),
    ...(typeof sp["maxFee"] === "string" ? { maxFee: sp["maxFee"] } : {}),
    ...(sp["week"] === "1" ? { week: "1" as const } : {}),
    ...(intakeParam ? { intake: intakeParam } : {}),
  };

  try {
    const db = createDb(url);
    const [patient] = await db
      .select({ id: patientProfiles.id })
      .from(patientProfiles)
      .where(eq(patientProfiles.userId, session.user.id));

    const [userRow] = await db.select({ countryId: users.countryId }).from(users).where(eq(users.id, session.user.id));

    let suggestedTags: string[] = [];
    if (patient && encryptionKey) {
      suggestedTags = await loadSuggestedTagsForPatient(
        db,
        patient.id,
        encryptionKey,
        typeof sp["intake"] === "string" ? sp["intake"] : undefined,
      );
    }

    const ranked = await listProfessionalsForPatient(
      db,
      filters,
      suggestedTags.length > 0
        ? {
            suggestedTags,
            patientCountryId: userRow?.countryId ?? null,
            patientLanguages: ["es"],
          }
        : null,
      userRow?.countryId ?? null,
    );

    const hasMore = ranked.length > PAGE_SIZE;
    const slice = ranked.slice(0, PAGE_SIZE);
    const countries = await fetchCountries(db);

    const items = slice.map((row) => ({
      id: row.professional.id,
      displayName: row.professional.displayName,
      specialties: row.professional.specialties,
      therapeuticApproach: row.professional.therapeuticApproach,
      languages: row.professional.languages,
      feeCents: row.professional.feeCents,
      currency: row.professional.currency,
      nextAvailabilityAt: row.professional.nextAvailabilityAt?.toISOString() ?? null,
      photoUrl: row.professional.photoUrl,
      photoAlt: row.professional.photoAlt,
      score: row.score,
      reasons: row.reasons,
    }));

    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-4 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-calm-900">Elegir profesional</h1>
          <p className="text-sm text-calm-800">
            Solo mostramos profesionales con credenciales verificadas. Las recomendaciones explican por qué encajan
            con tu autoevaluación.
          </p>
        </header>
        <ProfessionalsList items={items} countries={countries} filters={filterProps} hasMore={hasMore} />
      </main>
    );
  } catch {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <ProfessionalsList
          items={[]}
          countries={[]}
          filters={filterProps}
          hasMore={false}
          error="Ocurrió un error al cargar profesionales. Intentá de nuevo."
        />
      </main>
    );
  }
}