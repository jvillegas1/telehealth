import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import { parseServerEnv } from "@telehealth/config/env";

import { createDb } from "../client";
import { runMigrations } from "../migrate/run-migrations";
import { ensureAdminUser } from "./ensure-admin";

function resolveRepoRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (existsSync(resolve(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    dir = resolve(dir, "..");
  }
  return process.cwd();
}

function loadWebDevEnv(): void {
  const envPath = resolve(resolveRepoRoot(), "apps/web/.env.development");
  if (!existsSync(envPath)) {
    return;
  }
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadWebDevEnv();
process.env["APP_ENV"] ??= "development";
process.env["NODE_ENV"] ??= "development";
process.env["NEXT_PUBLIC_APP_URL"] ??= "http://localhost:3000";
process.env["PAYMENT_MODE"] ??= "sandbox";

const env = parseServerEnv(process.env);
const url = env.DATABASE_URL;
const key = env.ENCRYPTION_KEY ?? "01234567890123456789012345678901";

if (!url) {
  console.error("DATABASE_URL es obligatoria (p. ej. en apps/web/.env.local).");
  process.exit(1);
}

await runMigrations(url);
const db = createDb(url);
const result = await ensureAdminUser(db, key);

console.log(
  result.created ? "Usuario administrador creado." : "Usuario administrador actualizado.",
);
console.log("");
console.log("Ingreso: http://localhost:3000/ingreso");
console.log("Consola: http://localhost:3000/admin");
console.log("");
console.log(`  Email:      ${result.email}`);
console.log(`  Contraseña: ${result.password}`);
