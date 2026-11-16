import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../drizzle");

export async function runMigrations(databaseUrl: string): Promise<void> {
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const files = (await readdir(migrationsDir))
      .filter((name) => name.endsWith(".sql"))
      .sort();
    for (const file of files) {
      const sql = await readFile(path.join(migrationsDir, file), "utf8");
      await client.query(sql);
    }
  } finally {
    await client.end();
  }
}