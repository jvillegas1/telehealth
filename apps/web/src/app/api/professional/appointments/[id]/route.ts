import { NextResponse } from "next/server";
import { z } from "zod";

import { PaymentMode } from "@telehealth/config/env";
import {
  acceptProfessionalAppointment,
  createDb,
  rejectProfessionalAppointment,
} from "@telehealth/db";

import { auth } from "@/auth/auth";
import { getServerEnv } from "@/env.server";
import { getProfessionalProfileForUser } from "@/server/billing/professional-context";
import { enqueueAppointmentReminders } from "@/server/scheduling/reminders";
import { appointments } from "@telehealth/db/schema";
import { eq } from "drizzle-orm";

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("accept") }),
  z.object({ action: z.literal("reject") }),
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  if (session?.user?.role !== "professional" || !session.user.id) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
  }

  const { id } = await params;
  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) return NextResponse.json({ message: "Servicio no disponible." }, { status: 503 });

  const db = createDb(url);
  const profile = await getProfessionalProfileForUser(db, session.user.id);
  if (!profile) return NextResponse.json({ message: "Perfil no encontrado." }, { status: 400 });

  const sandbox = env.PAYMENT_MODE === PaymentMode.Sandbox;

  try {
    if (parsed.data.action === "accept") {
      await acceptProfessionalAppointment(db, id, profile.id, sandbox);
      const [apt] = await db.select().from(appointments).where(eq(appointments.id, id));
      if (apt) {
        const { patientProfiles } = await import("@telehealth/db/schema");
        const [patient] = await db
          .select({ userId: patientProfiles.userId })
          .from(patientProfiles)
          .where(eq(patientProfiles.id, apt.patientProfileId));
        if (patient?.userId) {
          await enqueueAppointmentReminders(db, {
            appointmentId: id,
            patientUserId: patient.userId,
            scheduledAt: apt.scheduledAt,
          });
        }
      }
      return NextResponse.json({ ok: true, status: "confirmed" });
    }

    await rejectProfessionalAppointment(db, id, profile.id);
    return NextResponse.json({ ok: true, status: "cancelled" });
  } catch (e) {
    return NextResponse.json(
      { message: e instanceof Error ? e.message : "No se pudo actualizar la cita." },
      { status: 400 },
    );
  }
}
