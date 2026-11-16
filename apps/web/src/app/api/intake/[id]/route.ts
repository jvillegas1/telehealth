import { NextResponse } from "next/server";

import { createDb, readIntakeFormForActor } from "@telehealth/db";

import { auth } from "@/auth/auth";
import { getServerEnv } from "@/env.server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return NextResponse.json({ message: "Debes iniciar sesión." }, { status: 401 });
  }

  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  const key = env.ENCRYPTION_KEY;
  if (!url || !key) {
    return NextResponse.json({ message: "El servicio no está disponible." }, { status: 503 });
  }

  const { id } = await context.params;
  const db = createDb(url);
  const result = await readIntakeFormForActor(db, {
    intakeFormId: id,
    actorUserId: session.user.id,
    actorRole: session.user.role as "patient" | "professional" | "admin",
    encryptionKey: key,
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status });
  }

  return NextResponse.json({
    message: "Ficha cargada.",
    content: JSON.parse(result.content) as unknown,
  });
}