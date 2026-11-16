import { formatEnvError, serverEnvSchema, type ServerEnv } from "./schema";

export type { ServerEnv } from "./schema";
export { AppEnv, PaymentMode, formatEnvError, serverEnvSchema } from "./schema";

/**
 * Valida variables de entorno al arrancar (REQ-INFRA-04, REQ-ARCH-03).
 */
export function parseServerEnv(raw: NodeJS.ProcessEnv): ServerEnv {
  const coerced = {
    APP_ENV: raw["APP_ENV"],
    NODE_ENV: raw["NODE_ENV"],
    NEXT_PUBLIC_APP_URL: raw["NEXT_PUBLIC_APP_URL"],
    PAYMENT_MODE: raw["PAYMENT_MODE"],
    DATABASE_URL: raw["DATABASE_URL"],
    ENCRYPTION_KEY: raw["ENCRYPTION_KEY"],
    LIVEKIT_URL: raw["LIVEKIT_URL"],
    LIVEKIT_API_KEY: raw["LIVEKIT_API_KEY"],
    LIVEKIT_API_SECRET: raw["LIVEKIT_API_SECRET"],
    AUTH_SECRET: raw["AUTH_SECRET"],
    ANTHROPIC_API_KEY: raw["ANTHROPIC_API_KEY"],
    ANTHROPIC_MODEL: raw["ANTHROPIC_MODEL"],
  };

  const result = serverEnvSchema.safeParse(coerced);
  if (!result.success) {
    throw new Error(formatEnvError(result.error));
  }
  return result.data;
}