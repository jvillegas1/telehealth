import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createDb } from "@telehealth/db";
import { isProfessionalSpecialty, PROFESSIONAL_SPECIALTIES } from "@telehealth/domain";
import { professionalProfiles as professionalProfilesTable } from "@telehealth/db/schema";

import { auth } from "@/auth/auth";
import { getServerEnv } from "@/env.server";

const saveSchema = z.object({
  displayName: z.string().min(2).max(120),
  bio: z.string().max(2000).optional(),
  countryId: z.string().uuid().optional(),
  specialties: z.array(z.string()).min(1),
  therapeuticApproach: z.string().max(500).optional(),
  languages: z.array(z.string()).min(1),
  feeCents: z.number().int().min(0).optional(),
  currency: z.string().length(3).optional(),
  photoAlt: z.string().max(200).optional(),
  submitForReview: z.boolean().optional(),
});

export async function GET(): Promise<Response> {
  const session = await auth();
  if (session?.user?.role !== "professional" || !session.user.id) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }
  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) return NextResponse.json({ profile: null });

  const db = createDb(url);
  const [profile] = await db
    .select()
    .from(professionalProfilesTable)
    .where(eq(professionalProfilesTable.userId, session.user.id));

  return NextResponse.json({ profile: profile ?? null, specialtiesCatalog: PROFESSIONAL_SPECIALTIES });
}

export async function PUT(request: Request): Promise<Response> {
  const session = await auth();
  if (session?.user?.role !== "professional" || !session.user.id) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const parsed = saveSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
  }

  if (!parsed.data.specialties.every((s) => isProfessionalSpecialty(s))) {
    return NextResponse.json({ message: "Especialidad no válida." }, { status: 400 });
  }

  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) {
    return NextResponse.json({ message: "Servicio no disponible." }, { status: 503 });
  }

  const db = createDb(url);
  const [existing] = await db
    .select()
    .from(professionalProfilesTable)
    .where(eq(professionalProfilesTable.userId, session.user.id));

  const nextStatus = parsed.data.submitForReview ? "pending_review" : (existing?.status ?? "draft");

  const values = {
    displayName: parsed.data.displayName,
    bio: parsed.data.bio ?? null,
    countryId: parsed.data.countryId ?? null,
    specialties: parsed.data.specialties,
    therapeuticApproach: parsed.data.therapeuticApproach ?? null,
    languages: parsed.data.languages,
    feeCents: parsed.data.feeCents ?? null,
    currency: parsed.data.currency ?? null,
    photoAlt: parsed.data.photoAlt ?? null,
    status: nextStatus,
    publishedAt: parsed.data.submitForReview ? null : existing?.publishedAt ?? null,
    updatedAt: new Date(),
  };

  if (existing) {
    await db.update(professionalProfilesTable).set(values).where(eq(professionalProfilesTable.id, existing.id));
    return NextResponse.json({ message: "Perfil actualizado.", status: nextStatus });
  }

  await db.insert(professionalProfilesTable).values({
    userId: session.user.id,
    ...values,
  });

  return NextResponse.json({ message: "Perfil creado.", status: nextStatus });
}