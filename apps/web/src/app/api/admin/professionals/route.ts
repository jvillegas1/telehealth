import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createDb } from "@telehealth/db";
import { credentials, professionalProfiles } from "@telehealth/db/schema";

import { auth } from "@/auth/auth";
import { getServerEnv } from "@/env.server";

const patchSchema = z.object({
  profileId: z.string().uuid(),
  credentialId: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
});

export async function GET(): Promise<Response> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) return NextResponse.json({ queue: [] });

  const db = createDb(url);
  const queue = await db
    .select({
      profile: professionalProfiles,
      credentialId: credentials.id,
      licenseNumber: credentials.licenseNumber,
      issuingBody: credentials.issuingBody,
      credentialStatus: credentials.status,
    })
    .from(professionalProfiles)
    .innerJoin(credentials, eq(credentials.professionalProfileId, professionalProfiles.id))
    .where(eq(professionalProfiles.status, "pending_review"));

  return NextResponse.json({ queue });
}

export async function PATCH(request: Request): Promise<Response> {
  const session = await auth();
  if (session?.user?.role !== "admin" || !session.user.id) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
  }

  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) {
    return NextResponse.json({ message: "Servicio no disponible." }, { status: 503 });
  }

  const db = createDb(url);
  const now = new Date();

  if (parsed.data.decision === "approve") {
    await db
      .update(credentials)
      .set({
        status: "verified",
        verifiedAt: now,
        verifiedByUserId: session.user.id,
        updatedAt: now,
      })
      .where(eq(credentials.id, parsed.data.credentialId));

    await db
      .update(professionalProfiles)
      .set({
        status: "approved",
        publishedAt: now,
        updatedAt: now,
      })
      .where(eq(professionalProfiles.id, parsed.data.profileId));
  } else {
    await db
      .update(credentials)
      .set({ status: "rejected", updatedAt: now })
      .where(eq(credentials.id, parsed.data.credentialId));
    await db
      .update(professionalProfiles)
      .set({ status: "rejected", publishedAt: null, updatedAt: now })
      .where(eq(professionalProfiles.id, parsed.data.profileId));
  }

  return NextResponse.json({ message: "Decisión registrada." });
}