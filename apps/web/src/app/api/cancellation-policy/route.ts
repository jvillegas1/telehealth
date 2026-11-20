import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { createDb } from "@telehealth/db";
import { users } from "@telehealth/db/schema";

import { auth } from "@/auth/auth";
import { getServerEnv } from "@/env.server";
import { getCancellationPolicy } from "@/server/scheduling/policy";

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) {
    return NextResponse.json({ policy: null }, { status: 503 });
  }

  const db = createDb(url);
  const [user] = await db.select().from(users).where(eq(users.id, session.user.id));
  const policy = await getCancellationPolicy(db, user?.countryId ?? null);
  return NextResponse.json({ policy });
}
