import { describe, expect, it } from "vitest";

import { isConsentActive } from "./consent";

describe("isConsentActive (REQ-SEC-02)", () => {
  it("revocación corta el acceso al instante", () => {
    const revokedAt = new Date("2025-01-02T12:00:00Z");
    expect(
      isConsentActive(
        { grantedAt: new Date("2025-01-01T12:00:00Z"), revokedAt },
        new Date("2025-01-02T12:00:01Z"),
      ),
    ).toBe(false);
  });

  it("consentimiento activo antes de revocar", () => {
    expect(
      isConsentActive(
        {
          grantedAt: new Date("2025-01-01T12:00:00Z"),
          revokedAt: new Date("2025-01-05T12:00:00Z"),
        },
        new Date("2025-01-02T12:00:00Z"),
      ),
    ).toBe(true);
  });
});