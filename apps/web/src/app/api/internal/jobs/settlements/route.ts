import { NextResponse } from "next/server";
import { createDb, runSettlementJob } from "@telehealth/db";

import { getServerEnv } from "@/env.server";

export async function POST(request: Request): Promise<Response> {
  const secret = request.headers.get("x-cron-secret");
  const env = getServerEnv();
  const expected = "CRON_SECRET" in env ? env.CRON_SECRET : process.env["CRON_SECRET"];
  if (!expected || secret !== expected) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) return NextResponse.json({ batches: 0 }, { status: 503 });

  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

  const mock = process.env["MOCK_SETTLEMENTS"] === "1";
  const created = await runSettlementJob(createDb(url), {
    periodStart: start,
    periodEnd: end,
    mockPay: mock,
  });

  return NextResponse.json({ batches: created });
}
