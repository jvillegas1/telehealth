import { NextResponse } from "next/server";

import { auth } from "@/auth/auth";
import { getServerEnv } from "@/env.server";
import { submitStep } from "@/server/assessment/service";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Debes iniciar sesión." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { step?: string; answer?: string };

  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  const key = env.ENCRYPTION_KEY ?? "01234567890123456789012345678901";

  const result = await submitStep({
    databaseUrl: url ?? "",
    encryptionKey: key,
    sessionId: id,
    userId: session.user.id,
    step: body.step ?? "",
    answer: body.answer ?? "",
  });

  if ("risk" in result && result.risk) {
    return NextResponse.json(result);
  }
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
  return NextResponse.json(result);
}