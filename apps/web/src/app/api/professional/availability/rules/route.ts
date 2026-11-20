import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createDb, recordScheduleAudit } from "@telehealth/db";
import { professionalAvailabilityRules, professionalProfiles } from "@telehealth/db/schema";

import { auth } from "@/auth/auth";
import { getServerEnv } from "@/env.server";

const ruleSchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  slotMinutes: z.number().int().min(15).max(180).optional(),
  bufferMinutes: z.number().int().min(0).max(60).optional(),
});

const putSchema = z.object({ rules: z.array(ruleSchema).min(1) });

export async function GET(): Promise<Response> {
  const session = await auth();
  if (session?.user?.role !== "professional" || !session.user.id) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) return NextResponse.json({ rules: [] });

  const db = createDb(url);
  const [profile] = await db
    .select()
    .from(professionalProfiles)
    .where(eq(professionalProfiles.userId, session.user.id));
  if (!profile) return NextResponse.json({ rules: [] });

  const rules = await db
    .select()
    .from(professionalAvailabilityRules)
    .where(eq(professionalAvailabilityRules.professionalProfileId, profile.id));

  return NextResponse.json({ rules });
}

export async function PUT(request: Request): Promise<Response> {
  const session = await auth();
  if (session?.user?.role !== "professional" || !session.user.id) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const parsed = putSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Reglas inválidas." }, { status: 400 });
  }

  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) {
    return NextResponse.json({ message: "Servicio no disponible." }, { status: 503 });
  }

  const db = createDb(url);
  const [profile] = await db
    .select()
    .from(professionalProfiles)
    .where(eq(professionalProfiles.userId, session.user.id));
  if (!profile) {
    return NextResponse.json({ message: "Creá tu perfil primero." }, { status: 400 });
  }

  await db
    .delete(professionalAvailabilityRules)
    .where(eq(professionalAvailabilityRules.professionalProfileId, profile.id));

  await db.insert(professionalAvailabilityRules).values(
    parsed.data.rules.map((r) => ({
      professionalProfileId: profile.id,
      dayOfWeek: r.dayOfWeek,
      startTime: r.startTime.length === 5 ? `${r.startTime}:00` : r.startTime,
      endTime: r.endTime.length === 5 ? `${r.endTime}:00` : r.endTime,
      slotMinutes: r.slotMinutes ?? 50,
      bufferMinutes: r.bufferMinutes ?? 10,
    })),
  );

  await recordScheduleAudit(db, {
    actorUserId: session.user.id,
    action: "availability_rules_updated",
    resourceType: "professional_profiles",
    resourceId: profile.id,
  });

  return NextResponse.json({ message: "Disponibilidad guardada." });
}
