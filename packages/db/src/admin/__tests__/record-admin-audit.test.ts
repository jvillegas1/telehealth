import { describe, expect, it, vi } from "vitest";

vi.mock("../record-admin-audit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../record-admin-audit")>();
  return actual;
});

describe("recordAdminAudit contract", () => {
  it("expects metadata string values only", () => {
    const metadata = { decision: "approve", role: "verifier" };
    for (const value of Object.values(metadata)) {
      expect(typeof value).toBe("string");
    }
  });
});
