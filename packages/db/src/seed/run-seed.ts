import { parseServerEnv } from "@telehealth/config/env";

import { createDb } from "../client";
import { runMigrations } from "../migrate/run-migrations";
import { seedAnonymized } from "./anonymized";

const env = parseServerEnv(process.env);
const url = env.DATABASE_URL;
const key = env.ENCRYPTION_KEY ?? "01234567890123456789012345678901";

if (!url) {
  console.error("DATABASE_URL es obligatoria.");
  process.exit(1);
}

await runMigrations(url);
const db = createDb(url);
await seedAnonymized(db, key);
console.log("Seed anonimizado aplicado.");