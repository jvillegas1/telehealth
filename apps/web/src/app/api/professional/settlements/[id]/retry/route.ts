import { NextResponse } from "next/server";

import { createDb, retryFailedSettlement } from "@telehealth/db";

import { auth } from "@/auth/auth";
import { getServerEnv } from "@/env.server";
import { getProfessionalProfileForUser } from "@/server/billing/professional-context";
import { settlementBatches } from "@telehealth/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  if (session?.user?.role !== "professional" || !session.user.id) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const { id } = await params;
  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) return NextResponse.json({ message: "Servicio no disponible." }, { status: 503 });

  const db = createDb(url);
  const profile = await getProfessionalProfileForUser(db, session.user.id);
  if (!profile) return NextResponse.json({ message: "Perfil no encontrado." }, { status: 400 });

  const [batch] = await db
    .select()
    .from(settlementBatches)
    .where(
      and(eq(settlementBatches.id, id), eq(settlementBatches.professionalProfileId, profile.id)),
    );
  if (!batch) return NextResponse.json({ message: "No encontrado." }, { status: 404 });

  const mock = process.env["MOCK_SETTLEMENTS"] === "1";
  try {
    await retryFailedSettlement(db, id, mock);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { message: e instanceof Error ? e.message : "Error al reintentar." },
      { status: 400 },
    );
  }
}
