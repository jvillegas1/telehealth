import { NextResponse } from "next/server";

import { auth } from "@/auth/auth";
import { getServerEnv } from "@/env.server";
import { finalizeSession } from "@/server/assessment/service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Debes iniciar sesión." }, { status: 401 });
  }

  const { id } = await context.params;
  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  const key = env.ENCRYPTION_KEY ?? "01234567890123456789012345678901";

  const result = await finalizeSession({
    databaseUrl: url ?? "",
    encryptionKey: key,
    sessionId: id,
    ...(env.ANTHROPIC_API_KEY ? { anthropicKey: env.ANTHROPIC_API_KEY } : {}),
    ...(env.ANTHROPIC_MODEL ? { anthropicModel: env.ANTHROPIC_MODEL } : {}),
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
  return NextResponse.json({
    intakeFormId: result.intakeFormId,
    output: result.output,
  });
}