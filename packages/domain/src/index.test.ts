import { describe, expect, it } from "vitest";

import { DOMAIN_PLACEHOLDER } from "./index";

describe("@telehealth/domain", () => {
  it("exporta placeholder de paquete (REQ-INFRA-01)", () => {
    expect(DOMAIN_PLACEHOLDER).toBe(true);
  });
});