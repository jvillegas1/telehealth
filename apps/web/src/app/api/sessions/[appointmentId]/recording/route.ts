import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createDb, ensureTherapySession, recordSessionAudit } from "@telehealth/db";
import { therapySessions } from "@telehealth/db/schema";

import { auth } from "@/auth/auth";
import { getServerEnv } from "@/env.server";
import { loadSessionAppointment } from "@/server/session/appointment-access";

const bodySchema = z.object({
  granted: z.boolean(),
  requestEnable: z.boolean().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ appointmentId: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
  }

  const { appointmentId } = await params;
  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) return NextResponse.json({ message: "Servicio no disponible." }, { status: 503 });

  const db = createDb(url);
  const ctx = await loadSessionAppointment(
    db,
    appointmentId,
    session.user.id,
    session.user.role ?? "patient",
  );
  if (!ctx) return NextResponse.json({ message: "No encontrado." }, { status: 404 });

  const therapy = await ensureTherapySession(db, appointmentId);
  const now = new Date();
  const updates: Partial<typeof therapySessions.$inferInsert> = {};

  if (parsed.data.requestEnable && ctx.participant === "professional") {
    updates.recordingEnabled = true;
  }

  if (parsed.data.granted) {
    if (ctx.participant === "patient") {
      updates.recordingPatientConsentAt = now;
    } else {
      updates.recordingProfessionalConsentAt = now;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: "Sin cambios." }, { status: 400 });
  }

  const [row] = await db
    .update(therapySessions)
    .set(updates)
    .where(eq(therapySessions.id, therapy.id))
    .returning();

  await recordSessionAudit(db, {
    actorUserId: session.user.id,
    action: parsed.data.granted
      ? "session_recording_consent_granted"
      : "session_recording_requested",
    resourceId: therapy.id,
    metadata: { role: ctx.participant },
  });

  const active =
    Boolean(row?.recordingEnabled) &&
    row?.recordingPatientConsentAt !== null &&
    row?.recordingProfessionalConsentAt !== null;

  return NextResponse.json({
    recordingEnabled: active,
    recordingPatientConsentAt: row?.recordingPatientConsentAt?.toISOString() ?? null,
    recordingProfessionalConsentAt: row?.recordingProfessionalConsentAt?.toISOString() ?? null,
  });
}
