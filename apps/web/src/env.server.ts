import { parseServerEnv, type ServerEnv } from "@telehealth/config/env";

let cached: ServerEnv | undefined;

/**
 * Valida entorno en servidor (REQ-INFRA-04).
 */
export function getServerEnv(): ServerEnv {
  if (process.env["NODE_ENV"] === "test") {
    return parseServerEnv(process.env);
  }
  if (!cached) {
    cached = parseServerEnv(process.env);
  }
  return cached;
}