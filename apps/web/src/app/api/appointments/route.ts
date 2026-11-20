import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { PaymentMode } from "@telehealth/config/env";

import {
  bookAppointment,
  createDb,
  ensureAppointmentPayment,
  ensureTherapySession,
  recordScheduleAudit,
  ScheduleConflictError,
} from "@telehealth/db";
import { appointments, patientProfiles, professionalProfiles, users } from "@telehealth/db/schema";

import { auth } from "@/auth/auth";
import { getServerEnv } from "@/env.server";
import { getPublicProfessionalById } from "@/server/professionals/list";
import { getCancellationPolicy } from "@/server/scheduling/policy";
import { enqueueAppointmentReminders } from "@/server/scheduling/reminders";

const createSchema = z.object({
  professionalProfileId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  scheduledEndAt: z.string().datetime(),
  policyVersion: z.number().int(),
  policyAccepted: z.literal(true),
});

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) return NextResponse.json({ appointments: [] });

  const db = createDb(url);
  const [patient] = await db
    .select()
    .from(patientProfiles)
    .where(eq(patientProfiles.userId, session.user.id));
  if (!patient) return NextResponse.json({ appointments: [] });

  const rows = await db
    .select({
      appointment: appointments,
      professionalName: professionalProfiles.displayName,
    })
    .from(appointments)
    .innerJoin(
      professionalProfiles,
      eq(professionalProfiles.id, appointments.professionalProfileId),
    )
    .where(eq(appointments.patientProfileId, patient.id))
    .orderBy(desc(appointments.scheduledAt));

  return NextResponse.json({
    appointments: rows.map((r) => ({
      ...r.appointment,
      professionalName: r.professionalName,
      scheduledAt: r.appointment.scheduledAt.toISOString(),
      scheduledEndAt: r.appointment.scheduledEndAt.toISOString(),
    })),
  });
}

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (session?.user?.role !== "patient" || !session.user.id) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
  }

  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) {
    return NextResponse.json({ message: "Servicio no disponible." }, { status: 503 });
  }

  const db = createDb(url);
  const pro = await getPublicProfessionalById(db, parsed.data.professionalProfileId);
  if (!pro) {
    return NextResponse.json({ message: "Profesional no disponible." }, { status: 404 });
  }

  const [patient] = await db
    .select()
    .from(patientProfiles)
    .where(eq(patientProfiles.userId, session.user.id));
  if (!patient) {
    return NextResponse.json({ message: "Perfil de paciente requerido." }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id));
  const policy = await getCancellationPolicy(db, user?.countryId ?? null);
  if (parsed.data.policyVersion !== policy.version) {
    return NextResponse.json(
      { message: "La política de cancelación cambió. Revisala y confirmá de nuevo." },
      { status: 409 },
    );
  }

  const now = new Date();
  try {
    const appointment = await bookAppointment(db, {
      patientProfileId: patient.id,
      professionalProfileId: parsed.data.professionalProfileId,
      scheduledAt: new Date(parsed.data.scheduledAt),
      scheduledEndAt: new Date(parsed.data.scheduledEndAt),
      cancellationPolicyVersion: policy.version,
      policyAcceptedAt: now,
    });

    await recordScheduleAudit(db, {
      actorUserId: session.user.id,
      action: "appointment_booked",
      resourceType: "appointments",
      resourceId: appointment.id,
    });

    await enqueueAppointmentReminders(db, {
      appointmentId: appointment.id,
      patientUserId: session.user.id,
      scheduledAt: appointment.scheduledAt,
    });

    await ensureTherapySession(db, appointment.id);
    const feeCents = pro.feeCents ?? 0;
    const currency = pro.currency ?? "ARS";
    await ensureAppointmentPayment(db, {
      appointmentId: appointment.id,
      amountCents: feeCents > 0 ? feeCents : 1,
      currency,
      sandboxAutoApprove: env.PAYMENT_MODE === PaymentMode.Sandbox,
    });

    return NextResponse.json({ appointmentId: appointment.id });
  } catch (e) {
    if (e instanceof ScheduleConflictError) {
      return NextResponse.json({ message: e.message }, { status: 409 });
    }
    throw e;
  }
}
