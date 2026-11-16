import { NextResponse } from "next/server";

import { auth } from "@/auth/auth";
import { getServerEnv } from "@/env.server";
import { createOrResumeSession } from "@/server/assessment/service";

export async function POST(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Debes iniciar sesión." }, { status: 401 });
  }

  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  const key = env.ENCRYPTION_KEY ?? "01234567890123456789012345678901";

  try {
    const result = await createOrResumeSession({
      databaseUrl: url ?? "",
      userId: session.user.id,
      encryptionKey: key,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ message: "No pudimos iniciar la autoevaluación." }, { status: 503 });
  }
}