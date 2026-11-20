import { NextResponse } from "next/server";

import { createDb } from "@telehealth/db";
import { ScheduleConflictError } from "@telehealth/db";

import { auth } from "@/auth/auth";
import { getServerEnv } from "@/env.server";
import { getPublicProfessionalById } from "@/server/professionals/list";
import { getPatientTimeZone, getProfessionalSlots } from "@/server/scheduling/slots";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) {
    return NextResponse.json({ slots: [] }, { status: 503 });
  }

  const db = createDb(url);
  const pro = await getPublicProfessionalById(db, id);
  if (!pro) {
    return NextResponse.json({ message: "Profesional no disponible." }, { status: 404 });
  }

  try {
    const patientTz = await getPatientTimeZone(db, session.user.id);
    const slots = await getProfessionalSlots(db, id, patientTz);
    return NextResponse.json({
      patientTimeZone: patientTz,
      slots: slots.map((s) => ({
        startUtc: s.startUtc.toISOString(),
        endUtc: s.endUtc.toISOString(),
        label: s.labelInPatientZone,
      })),
    });
  } catch (e) {
    if (e instanceof ScheduleConflictError) {
      return NextResponse.json({ message: e.message }, { status: 409 });
    }
    return NextResponse.json({ message: "No pudimos cargar horarios." }, { status: 500 });
  }
}
