import { describe, expect, it } from "vitest";

import { parseServerEnv } from "./index";

const devBase = {
  APP_ENV: "development",
  NODE_ENV: "development",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  PAYMENT_MODE: "sandbox",
} as const;

describe("parseServerEnv", () => {
  it("acepta development con variables mínimas (REQ-INFRA-04)", () => {
    const env = parseServerEnv({ ...devBase });
    expect(env.APP_ENV).toBe("development");
    expect(env.PAYMENT_MODE).toBe("sandbox");
  });

  it("exige sandbox en staging", () => {
    expect(() =>
      parseServerEnv({
        APP_ENV: "staging",
        NODE_ENV: "production",
        NEXT_PUBLIC_APP_URL: "https://staging.example.com",
        PAYMENT_MODE: "live",
        DATABASE_URL: "postgresql://localhost/db",
        ENCRYPTION_KEY: "a".repeat(32),
        AUTH_SECRET: "a".repeat(32),
      }),
    ).toThrow(/configuración del entorno/);
  });

  it("acepta staging con sandbox y claves obligatorias", () => {
    const env = parseServerEnv({
      APP_ENV: "staging",
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_URL: "https://staging.example.com",
      PAYMENT_MODE: "sandbox",
      DATABASE_URL: "postgresql://localhost/db",
      ENCRYPTION_KEY: "b".repeat(32),
      AUTH_SECRET: "b".repeat(32),
    });
    expect(env.APP_ENV).toBe("staging");
    expect(env.PAYMENT_MODE).toBe("sandbox");
  });

  it("exige live en producción", () => {
    const env = parseServerEnv({
      APP_ENV: "production",
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_URL: "https://app.example.com",
      PAYMENT_MODE: "live",
      DATABASE_URL: "postgresql://localhost/db",
      ENCRYPTION_KEY: "c".repeat(32),
      AUTH_SECRET: "c".repeat(32),
      LIVEKIT_URL: "https://livekit.example.com",
      LIVEKIT_API_KEY: "key",
      LIVEKIT_API_SECRET: "secret",
    });
    expect(env.PAYMENT_MODE).toBe("live");
  });
});