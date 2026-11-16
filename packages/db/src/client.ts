import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import * as schema from "./schema";

const { Pool } = pg;

export type Db = ReturnType<typeof drizzle<typeof schema>>;

let pool: pg.Pool | undefined;

export function getPool(databaseUrl: string): pg.Pool {
  if (!pool) {
    pool = new Pool({ connectionString: databaseUrl, max: 10 });
  }
  return pool;
}

export function createDb(databaseUrl: string): Db {
  return drizzle(getPool(databaseUrl), { schema });
}