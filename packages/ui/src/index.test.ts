import { describe, expect, it } from "vitest";

import { UI_PACKAGE_READY } from "./index";

describe("@telehealth/ui", () => {
  it("paquete UI listo (REQ-INFRA-01)", () => {
    expect(UI_PACKAGE_READY).toBe(true);
  });
});