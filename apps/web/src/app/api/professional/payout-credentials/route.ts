import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createDb, decryptField, encryptField } from "@telehealth/db";
import { countries, professionalPayoutCredentials } from "@telehealth/db/schema";
import { AR_PAYOUT_SCHEMA_VERSION, arPayoutFormSchema } from "@telehealth/domain";

import { auth } from "@/auth/auth";
import { getServerEnv } from "@/env.server";
import { getProfessionalProfileForUser } from "@/server/billing/professional-context";

const putSchema = z.object({
  countryCode: z.string().min(2).max(2),
  payload: arPayoutFormSchema,
});

export async function GET(): Promise<Response> {
  const session = await auth();
  if (session?.user?.role !== "professional" || !session.user.id) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  const key = "ENCRYPTION_KEY" in env ? env.ENCRYPTION_KEY : undefined;
  if (!url) return NextResponse.json({ configured: false });

  const db = createDb(url);
  const profile = await getProfessionalProfileForUser(db, session.user.id);
  if (!profile) return NextResponse.json({ configured: false });

  const [row] = await db
    .select()
    .from(professionalPayoutCredentials)
    .where(eq(professionalPayoutCredentials.professionalProfileId, profile.id));
  if (!row || !key) {
    return NextResponse.json({ configured: Boolean(row) });
  }

  const json = decryptField(
    { ciphertext: row.payloadCiphertext, iv: row.payloadIv, tag: row.payloadTag },
    key,
  );

  return NextResponse.json({
    configured: true,
    schemaVersion: row.schemaVersion,
    lastValidatedAt: row.lastValidatedAt?.toISOString() ?? null,
    preview: JSON.parse(json) as Record<string, string>,
  });
}

export async function PUT(request: Request): Promise<Response> {
  const session = await auth();
  if (session?.user?.role !== "professional" || !session.user.id) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const parsed = putSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos de cobro inválidos." }, { status: 400 });
  }

  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  const key = "ENCRYPTION_KEY" in env ? env.ENCRYPTION_KEY : undefined;
  if (!url || !key) {
    return NextResponse.json({ message: "Servicio no disponible." }, { status: 503 });
  }

  const db = createDb(url);
  const profile = await getProfessionalProfileForUser(db, session.user.id);
  if (!profile) return NextResponse.json({ message: "Perfil no encontrado." }, { status: 400 });

  const [country] = await db
    .select()
    .from(countries)
    .where(eq(countries.code, parsed.data.countryCode.toUpperCase()));
  if (!country) {
    return NextResponse.json({ message: "País no soportado." }, { status: 400 });
  }

  const enc = encryptField(JSON.stringify(parsed.data.payload), key);
  const now = new Date();

  await db
    .insert(professionalPayoutCredentials)
    .values({
      professionalProfileId: profile.id,
      countryId: country.id,
      schemaVersion: AR_PAYOUT_SCHEMA_VERSION,
      payloadCiphertext: enc.ciphertext,
      payloadIv: enc.iv,
      payloadTag: enc.tag,
      lastValidatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        professionalPayoutCredentials.professionalProfileId,
        professionalPayoutCredentials.countryId,
      ],
      set: {
        schemaVersion: AR_PAYOUT_SCHEMA_VERSION,
        payloadCiphertext: enc.ciphertext,
        payloadIv: enc.iv,
        payloadTag: enc.tag,
        lastValidatedAt: now,
        updatedAt: now,
      },
    });

  return NextResponse.json({ ok: true });
}
