import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createDb,
  decryptField,
  encryptField,
  ensureTherapySession,
  recordSessionAudit,
} from "@telehealth/db";

import { auth } from "@/auth/auth";
import { getServerEnv } from "@/env.server";
import { loadSessionAppointment } from "@/server/session/appointment-access";

const patchSchema = z.object({
  notes: z.string().max(20_000),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ appointmentId: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "professional") {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const { appointmentId } = await params;
  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) return NextResponse.json({ notes: null });

  const db = createDb(url);
  const ctx = await loadSessionAppointment(db, appointmentId, session.user.id, "professional");
  if (!ctx) return NextResponse.json({ message: "No encontrado." }, { status: 404 });

  const therapy = await ensureTherapySession(db, appointmentId);
  if (
    !therapy.professionalNotesCiphertext ||
    !therapy.professionalNotesIv ||
    !therapy.professionalNotesTag
  ) {
    return NextResponse.json({ notes: "" });
  }

  const key = "ENCRYPTION_KEY" in env ? env.ENCRYPTION_KEY : undefined;
  if (!key) return NextResponse.json({ message: "Cifrado no configurado." }, { status: 503 });

  const notes = decryptField(
    {
      ciphertext: therapy.professionalNotesCiphertext,
      iv: therapy.professionalNotesIv,
      tag: therapy.professionalNotesTag,
    },
    key,
  );

  await recordSessionAudit(db, {
    actorUserId: session.user.id,
    action: "session_notes_read",
    resourceId: therapy.id,
  });

  return NextResponse.json({ notes });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ appointmentId: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "professional") {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
  }

  const { appointmentId } = await params;
  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  const key = "ENCRYPTION_KEY" in env ? env.ENCRYPTION_KEY : undefined;
  if (!url || !key) {
    return NextResponse.json({ message: "Servicio no disponible." }, { status: 503 });
  }

  const db = createDb(url);
  const ctx = await loadSessionAppointment(db, appointmentId, session.user.id, "professional");
  if (!ctx) return NextResponse.json({ message: "No encontrado." }, { status: 404 });

  const therapy = await ensureTherapySession(db, appointmentId);
  const enc = encryptField(parsed.data.notes, key);

  const { therapySessions } = await import("@telehealth/db/schema");
  await db
    .update(therapySessions)
    .set({
      professionalNotesCiphertext: enc.ciphertext,
      professionalNotesIv: enc.iv,
      professionalNotesTag: enc.tag,
    })
    .where(eq(therapySessions.id, therapy.id));

  await recordSessionAudit(db, {
    actorUserId: session.user.id,
    action: "session_notes_saved",
    resourceId: therapy.id,
  });

  return NextResponse.json({ ok: true });
}
