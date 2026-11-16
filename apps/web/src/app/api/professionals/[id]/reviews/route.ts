import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createDb } from "@telehealth/db";
import { appointments, patientProfiles, professionalReviews } from "@telehealth/db/schema";
import { professionalReviewSchema, validateReviewComment } from "@telehealth/domain";

import { auth } from "@/auth/auth";
import { getServerEnv } from "@/env.server";
import { getPublicProfessionalById } from "@/server/professionals/list";

const bodySchema = professionalReviewSchema.extend({
  appointmentId: z.string().uuid(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id: professionalId } = await params;
  const session = await auth();
  if (session?.user?.role !== "patient" || !session.user.id) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Valoración inválida." }, { status: 400 });
  }

  const commentError = validateReviewComment(parsed.data.comment);
  if (commentError) {
    return NextResponse.json({ message: commentError }, { status: 400 });
  }

  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) {
    return NextResponse.json({ message: "Servicio no disponible." }, { status: 503 });
  }

  const db = createDb(url);
  const professional = await getPublicProfessionalById(db, professionalId);
  if (!professional) {
    return NextResponse.json({ message: "Profesional no publicado." }, { status: 404 });
  }

  const [patient] = await db
    .select()
    .from(patientProfiles)
    .where(eq(patientProfiles.userId, session.user.id));

  if (!patient) {
    return NextResponse.json({ message: "Perfil de paciente requerido." }, { status: 400 });
  }

  const [appointment] = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.id, parsed.data.appointmentId),
        eq(appointments.patientProfileId, patient.id),
        eq(appointments.professionalProfileId, professionalId),
        eq(appointments.status, "completed"),
      ),
    );

  if (!appointment) {
    return NextResponse.json({ message: "Solo podés valorar tras una cita completada." }, { status: 400 });
  }

  await db.insert(professionalReviews).values({
    professionalProfileId: professionalId,
    patientProfileId: patient.id,
    appointmentId: appointment.id,
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null,
    moderationStatus: "pending",
  });

  return NextResponse.json({ message: "Gracias. Tu opinión será revisada antes de publicarse." });
}