import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  bookAppointment,
  cancelAppointment,
  createDb,
  recordScheduleAudit,
  ScheduleConflictError,
} from "@telehealth/db";
import { appointments, patientProfiles, users } from "@telehealth/db/schema";
import { canCancelAppointment, canRescheduleAppointment } from "@telehealth/domain";

import { auth } from "@/auth/auth";
import { getServerEnv } from "@/env.server";
import { getCancellationPolicy } from "@/server/scheduling/policy";
import { cancelPendingReminders, enqueueAppointmentReminders } from "@/server/scheduling/reminders";

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("cancel") }),
  z.object({
    action: z.literal("reschedule"),
    scheduledAt: z.string().datetime(),
    scheduledEndAt: z.string().datetime(),
    policyVersion: z.number().int(),
    policyAccepted: z.literal(true),
  }),
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const session = await auth();
  if (session?.user?.role !== "patient" || !session.user.id) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Solicitud inválida." }, { status: 400 });
  }

  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) {
    return NextResponse.json({ message: "Servicio no disponible." }, { status: 503 });
  }

  const db = createDb(url);
  const [patient] = await db
    .select()
    .from(patientProfiles)
    .where(eq(patientProfiles.userId, session.user.id));
  if (!patient) {
    return NextResponse.json({ message: "Perfil requerido." }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.id, id), eq(appointments.patientProfileId, patient.id)));

  if (!existing || existing.status === "cancelled") {
    return NextResponse.json({ message: "Cita no encontrada." }, { status: 404 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id));
  const policy = await getCancellationPolicy(db, user?.countryId ?? null);
  const now = new Date();

  if (parsed.data.action === "cancel") {
    const check = canCancelAppointment({ scheduledAt: existing.scheduledAt, now, policy });
    if (!check.allowed) {
      return NextResponse.json(
        { message: check.reason ?? "No se puede cancelar." },
        { status: 400 },
      );
    }
    await cancelAppointment(db, id, patient.id);
    await cancelPendingReminders(db, id);
    await recordScheduleAudit(db, {
      actorUserId: session.user.id,
      action: "appointment_cancelled",
      resourceType: "appointments",
      resourceId: id,
    });
    return NextResponse.json({ message: "Cita cancelada." });
  }

  const check = canRescheduleAppointment({ scheduledAt: existing.scheduledAt, now, policy });
  if (!check.allowed) {
    return NextResponse.json(
      { message: check.reason ?? "No se puede reprogramar." },
      { status: 400 },
    );
  }

  if (parsed.data.policyVersion !== policy.version) {
    return NextResponse.json(
      { message: "Revisá la política de cancelación actualizada." },
      { status: 409 },
    );
  }

  try {
    await cancelAppointment(db, id, patient.id);
    await cancelPendingReminders(db, id);

    const created = await bookAppointment(db, {
      patientProfileId: patient.id,
      professionalProfileId: existing.professionalProfileId,
      scheduledAt: new Date(parsed.data.scheduledAt),
      scheduledEndAt: new Date(parsed.data.scheduledEndAt),
      cancellationPolicyVersion: policy.version,
      policyAcceptedAt: now,
      rescheduledFromId: id,
    });

    await recordScheduleAudit(db, {
      actorUserId: session.user.id,
      action: "appointment_rescheduled",
      resourceType: "appointments",
      resourceId: created.id,
      metadata: { from: id },
    });

    await enqueueAppointmentReminders(db, {
      appointmentId: created.id,
      patientUserId: session.user.id,
      scheduledAt: created.scheduledAt,
    });

    return NextResponse.json({ appointmentId: created.id });
  } catch (e) {
    if (e instanceof ScheduleConflictError) {
      return NextResponse.json({ message: e.message }, { status: 409 });
    }
    throw e;
  }
}
