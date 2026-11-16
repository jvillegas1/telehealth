import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { getServerEnv } from "./env.server";

const original = { ...process.env };

describe("getServerEnv", () => {
  beforeEach(() => {
    process.env = {
      ...original,
      APP_ENV: "development",
      NODE_ENV: "development",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      PAYMENT_MODE: "sandbox",
    };
  });

  afterEach(() => {
    process.env = original;
  });

  it("valida entorno de desarrollo al importar (REQ-INFRA-04)", () => {
    const env = getServerEnv();
    expect(env.APP_ENV).toBe("development");
  });
});