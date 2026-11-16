import { NextResponse } from "next/server";

import { auth } from "@/auth/auth";
import { getServerEnv } from "@/env.server";
import { getCrisisResources } from "@/server/assessment/service";

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Debes iniciar sesión." }, { status: 401 });
  }

  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  const resources = await getCrisisResources(url ?? "", session.user.id);
  return NextResponse.json({ resources });
}