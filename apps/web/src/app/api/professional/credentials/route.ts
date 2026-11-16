import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createDb } from "@telehealth/db";
import {
  credentialDocuments,
  credentials,
  professionalProfiles,
} from "@telehealth/db/schema";

import { auth } from "@/auth/auth";
import { getServerEnv } from "@/env.server";
import { saveCredentialDocument } from "@/server/uploads/credential-storage";

const bodySchema = z.object({
  licenseNumber: z.string().min(3).max(80),
  issuingBody: z.string().min(2).max(120),
});

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (session?.user?.role !== "professional" || !session.user.id) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) {
    return NextResponse.json({ message: "Servicio no disponible." }, { status: 503 });
  }

  const form = await request.formData();
  const meta = bodySchema.safeParse({
    licenseNumber: form.get("licenseNumber"),
    issuingBody: form.get("issuingBody"),
  });
  if (!meta.success) {
    return NextResponse.json({ message: "Datos de matrícula inválidos." }, { status: 400 });
  }

  const file = form.get("document");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Falta el documento." }, { status: 400 });
  }

  const db = createDb(url);
  const [profile] = await db
    .select()
    .from(professionalProfiles)
    .where(eq(professionalProfiles.userId, session.user.id));

  if (!profile) {
    return NextResponse.json({ message: "Completá el perfil primero." }, { status: 400 });
  }

  try {
    const saved = await saveCredentialDocument({ file, professionalId: profile.id });
    const [credential] = await db
      .insert(credentials)
      .values({
        professionalProfileId: profile.id,
        licenseNumber: meta.data.licenseNumber,
        issuingBody: meta.data.issuingBody,
        status: "pending",
      })
      .returning();

    await db.insert(credentialDocuments).values({
      credentialId: credential!.id,
      fileName: saved.fileName,
      storageKey: saved.storageKey,
      mimeType: saved.mimeType,
      sizeBytes: saved.sizeBytes,
    });

    await db
      .update(professionalProfiles)
      .set({
        status: "pending_review",
        publishedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(professionalProfiles.id, profile.id));

    return NextResponse.json({ message: "Credencial enviada a revisión." });
  } catch (e) {
    if (e instanceof Error && e.message === "FILE_TOO_LARGE") {
      return NextResponse.json({ message: "El archivo supera 2 MB." }, { status: 400 });
    }
    return NextResponse.json({ message: "No pudimos guardar el documento." }, { status: 400 });
  }
}