import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createDb } from "@telehealth/db";
import { consents, intakeForms, patientProfiles, professionalProfiles } from "@telehealth/db/schema";

import { auth } from "@/auth/auth";
import { getServerEnv } from "@/env.server";

const bodySchema = z.object({
  intakeFormId: z.string().uuid(),
  professionalProfileId: z.string().uuid(),
});

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Debes iniciar sesión." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
  }

  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) return NextResponse.json({ message: "Servicio no disponible." }, { status: 503 });

  const db = createDb(url);
  const [profile] = await db
    .select()
    .from(patientProfiles)
    .where(eq(patientProfiles.userId, session.user.id));
  if (!profile) return NextResponse.json({ message: "Perfil no encontrado." }, { status: 403 });

  const [intake] = await db
    .select()
    .from(intakeForms)
    .where(eq(intakeForms.id, parsed.data.intakeFormId));
  if (!intake || intake.patientProfileId !== profile.id) {
    return NextResponse.json({ message: "Ficha no encontrada." }, { status: 404 });
  }

  const [pro] = await db
    .select()
    .from(professionalProfiles)
    .where(eq(professionalProfiles.id, parsed.data.professionalProfileId));
  if (!pro) return NextResponse.json({ message: "Profesional no encontrado." }, { status: 404 });

  await db.insert(consents).values({
    patientProfileId: profile.id,
    intakeFormId: intake.id,
    professionalProfileId: pro.id,
    scope: "intake_form_share",
  });

  return NextResponse.json({ message: "Consentimiento otorgado." });
}

export async function DELETE(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Debes iniciar sesión." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
  }

  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) return NextResponse.json({ message: "Servicio no disponible." }, { status: 503 });

  const db = createDb(url);
  const [profile] = await db
    .select()
    .from(patientProfiles)
    .where(eq(patientProfiles.userId, session.user.id));
  if (!profile) return NextResponse.json({ message: "Perfil no encontrado." }, { status: 403 });

  await db
    .update(consents)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(consents.intakeFormId, parsed.data.intakeFormId),
        eq(consents.professionalProfileId, parsed.data.professionalProfileId),
        eq(consents.patientProfileId, profile.id),
        isNull(consents.revokedAt),
      ),
    );

  return NextResponse.json({ message: "Consentimiento revocado." });
}