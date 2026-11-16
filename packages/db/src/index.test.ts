import { describe, expect, it } from "vitest";

import { DB_PACKAGE_READY } from "./index";

describe("@telehealth/db", () => {
  it("paquete listo sin esquema de negocio (REQ-INFRA-01)", () => {
    expect(DB_PACKAGE_READY).toBe(true);
  });
});