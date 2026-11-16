import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createDb } from "@telehealth/db";
import { crisisResources } from "@telehealth/db/schema";

import { auth } from "@/auth/auth";
import { getServerEnv } from "@/env.server";

const verifySchema = z.object({
  id: z.string().uuid(),
  active: z.boolean(),
});

export async function GET(): Promise<Response> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }
  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) return NextResponse.json({ resources: [] });
  const db = createDb(url);
  const resources = await db.select().from(crisisResources).orderBy(desc(crisisResources.createdAt));
  return NextResponse.json({ resources });
}

export async function PATCH(request: Request): Promise<Response> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }
  const parsed = verifySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
  }

  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) {
    return NextResponse.json({ message: "Servicio no disponible." }, { status: 503 });
  }

  const db = createDb(url);
  await db
    .update(crisisResources)
    .set({
      active: parsed.data.active,
      verifiedAt: parsed.data.active ? new Date() : null,
      verifiedByUserId: parsed.data.active ? session.user.id : null,
    })
    .where(eq(crisisResources.id, parsed.data.id));

  return NextResponse.json({ message: "Recurso actualizado." });
}