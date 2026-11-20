import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { createDb, ensureTherapySession, recordSessionAudit } from "@telehealth/db";
import { users } from "@telehealth/db/schema";
import { evaluateSessionJoin } from "@telehealth/domain";

import { auth } from "@/auth/auth";
import { getServerEnv } from "@/env.server";
import { loadSessionAppointment } from "@/server/session/appointment-access";
import {
  isLiveKitMocked,
  issueLiveKitToken,
  issueMockLiveKitToken,
} from "@/server/video/livekit-token";

const denialMessages: Record<string, string> = {
  appointment_not_confirmed: "La cita aún no está confirmada.",
  payment_required: "El pago de la sesión debe estar aprobado.",
  outside_window: "La videollamada solo está disponible cerca del horario de la cita.",
  appointment_cancelled: "Esta cita fue cancelada.",
  appointment_completed: "Esta cita ya finalizó.",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ appointmentId: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const { appointmentId } = await params;
  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) {
    return NextResponse.json({ message: "Servicio no disponible." }, { status: 503 });
  }

  const db = createDb(url);
  const ctx = await loadSessionAppointment(
    db,
    appointmentId,
    session.user.id,
    session.user.role ?? "patient",
  );
  if (!ctx) {
    return NextResponse.json({ message: "No encontrado." }, { status: 404 });
  }

  const decision = evaluateSessionJoin({
    now: new Date(),
    scheduledAt: ctx.appointment.scheduledAt,
    scheduledEndAt: ctx.appointment.scheduledEndAt,
    appointmentStatus: ctx.appointment.status,
    paymentStatus: ctx.paymentStatus ?? null,
    requirePayment: true,
  });

  if (!decision.allowed) {
    return NextResponse.json(
      { message: denialMessages[decision.reason] ?? "No podés ingresar a la sesión." },
      { status: 403 },
    );
  }

  const therapy = await ensureTherapySession(db, appointmentId);
  const roomName = therapy.livekitRoomName ?? `appt_${appointmentId.replace(/-/g, "")}`;

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id));
  const displayName = user?.name ?? session.user.email ?? session.user.id;

  let tokenPayload: { token: string; url: string };
  if (isLiveKitMocked()) {
    tokenPayload = issueMockLiveKitToken({
      roomName,
      participantIdentity: session.user.id,
      participantName: displayName,
    });
  } else {
    const livekitUrl = "LIVEKIT_URL" in env ? env.LIVEKIT_URL : undefined;
    const apiKey = "LIVEKIT_API_KEY" in env ? env.LIVEKIT_API_KEY : undefined;
    const apiSecret = "LIVEKIT_API_SECRET" in env ? env.LIVEKIT_API_SECRET : undefined;
    if (!livekitUrl || !apiKey || !apiSecret) {
      return NextResponse.json(
        { message: "Videollamadas no configuradas. Usá MOCK_LIVEKIT=1 en desarrollo." },
        { status: 503 },
      );
    }
    tokenPayload = await issueLiveKitToken(
      { url: livekitUrl, apiKey, apiSecret },
      {
        roomName,
        participantIdentity: session.user.id,
        participantName: displayName,
      },
    );
  }

  await recordSessionAudit(db, {
    actorUserId: session.user.id,
    action: "session_token_issued",
    resourceId: therapy.id,
    metadata: { role: ctx.participant },
  });

  return NextResponse.json({
    token: tokenPayload.token,
    livekitUrl: tokenPayload.url,
    roomName,
    role: ctx.participant,
    e2eeEnabled: therapy.e2eeEnabled,
    subtitlesEnabled: therapy.subtitlesEnabled,
    recordingEnabled:
      therapy.recordingEnabled &&
      therapy.recordingPatientConsentAt !== null &&
      therapy.recordingProfessionalConsentAt !== null,
    scheduledAt: ctx.appointment.scheduledAt.toISOString(),
    scheduledEndAt: ctx.appointment.scheduledEndAt.toISOString(),
    professionalName: ctx.professionalName,
  });
}
