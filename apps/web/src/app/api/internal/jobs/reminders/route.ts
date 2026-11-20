import { NextResponse } from "next/server";

import { createDb } from "@telehealth/db";

import { getServerEnv } from "@/env.server";
import { processDueReminders } from "@/server/scheduling/reminders";

export async function POST(request: Request): Promise<Response> {
  const secret = request.headers.get("x-cron-secret");
  const env = getServerEnv();
  const expected = "CRON_SECRET" in env ? env.CRON_SECRET : process.env["CRON_SECRET"];
  if (!expected || secret !== expected) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) {
    return NextResponse.json({ sent: 0 }, { status: 503 });
  }

  const sent = await processDueReminders(createDb(url));
  return NextResponse.json({ sent });
}
