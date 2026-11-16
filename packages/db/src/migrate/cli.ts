import { parseServerEnv } from "@telehealth/config/env";

import { runMigrations } from "./run-migrations";

const env = parseServerEnv(process.env);
const url = env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL es obligatoria para migrar.");
  process.exit(1);
}

await runMigrations(url);
console.log("Migraciones aplicadas.");