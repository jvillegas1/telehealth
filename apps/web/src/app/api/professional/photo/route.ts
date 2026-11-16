import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createDb } from "@telehealth/db";
import { professionalProfiles } from "@telehealth/db/schema";

import { auth } from "@/auth/auth";
import { getServerEnv } from "@/env.server";
import { saveProfessionalPhoto } from "@/server/uploads/credential-storage";

const altSchema = z.object({ photoAlt: z.string().min(4).max(200) });

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
  const file = form.get("photo");
  const altParsed = altSchema.safeParse({ photoAlt: form.get("photoAlt") });
  if (!(file instanceof File) || !altParsed.success) {
    return NextResponse.json({ message: "Foto o texto alternativo inválidos." }, { status: 400 });
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
    const { photoUrl } = await saveProfessionalPhoto({ file, professionalId: profile.id });
    await db
      .update(professionalProfiles)
      .set({ photoUrl, photoAlt: altParsed.data.photoAlt, updatedAt: new Date() })
      .where(eq(professionalProfiles.id, profile.id));
    return NextResponse.json({ photoUrl });
  } catch (e) {
    if (e instanceof Error && e.message === "FILE_TOO_LARGE") {
      return NextResponse.json({ message: "La imagen supera 2 MB." }, { status: 400 });
    }
    return NextResponse.json({ message: "No pudimos guardar la foto." }, { status: 400 });
  }
}