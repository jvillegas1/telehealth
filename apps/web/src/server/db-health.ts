import { sql } from "drizzle-orm";

import { createDb } from "@telehealth/db";

import { getServerEnv } from "@/env.server";

export async function isDatabaseReachable(): Promise<boolean> {
  const env = getServerEnv();
  const url = "DATABASE_URL" in env ? env.DATABASE_URL : undefined;
  if (!url) {
    return false;
  }
  try {
    const db = createDb(url);
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}
