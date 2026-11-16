import { z } from "zod";

export const AppEnv = {
  Development: "development",
  Staging: "staging",
  Production: "production",
} as const;

export const PaymentMode = {
  Sandbox: "sandbox",
  Live: "live",
} as const;

const urlSchema = z.string().url();

const baseSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  NEXT_PUBLIC_APP_URL: urlSchema,
  AUTH_SECRET: z.string().min(32).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_MODEL: z.string().min(1).optional(),
});

const developmentSchema = baseSchema.extend({
  APP_ENV: z.literal(AppEnv.Development),
  PAYMENT_MODE: z.enum([PaymentMode.Sandbox, PaymentMode.Live]).default(PaymentMode.Sandbox),
  DATABASE_URL: z.string().min(1).optional(),
  ENCRYPTION_KEY: z.string().min(32).optional(),
  LIVEKIT_URL: urlSchema.optional(),
  LIVEKIT_API_KEY: z.string().min(1).optional(),
  LIVEKIT_API_SECRET: z.string().min(1).optional(),
});

const stagingSchema = baseSchema.extend({
  APP_ENV: z.literal(AppEnv.Staging),
  PAYMENT_MODE: z.literal(PaymentMode.Sandbox),
  AUTH_SECRET: z.string().min(32),
  DATABASE_URL: z.string().min(1),
  ENCRYPTION_KEY: z.string().min(32),
  LIVEKIT_URL: urlSchema.optional(),
  LIVEKIT_API_KEY: z.string().min(1).optional(),
  LIVEKIT_API_SECRET: z.string().min(1).optional(),
});

const productionSchema = baseSchema.extend({
  APP_ENV: z.literal(AppEnv.Production),
  PAYMENT_MODE: z.literal(PaymentMode.Live),
  AUTH_SECRET: z.string().min(32),
  DATABASE_URL: z.string().min(1),
  ENCRYPTION_KEY: z.string().min(32),
  LIVEKIT_URL: urlSchema,
  LIVEKIT_API_KEY: z.string().min(1),
  LIVEKIT_API_SECRET: z.string().min(1),
});

export const serverEnvSchema = z.discriminatedUnion("APP_ENV", [
  developmentSchema,
  stagingSchema,
  productionSchema,
]);

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function formatEnvError(error: z.ZodError): string {
  const lines = error.issues.map((issue) => {
    const path = issue.path.join(".") || "(raíz)";
    return `${path}: ${issue.message}`;
  });
  return [
    "La configuración del entorno no es válida.",
    "Revisa .env.example y corrige las variables indicadas:",
    ...lines,
  ].join("\n");
}