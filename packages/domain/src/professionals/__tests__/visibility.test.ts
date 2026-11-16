import { describe, expect, it } from "vitest";

import { isProfessionallyListed } from "../visibility";

describe("isProfessionallyListed (REQ 7.2)", () => {
  it.each([
    { status: "approved" as const, hasVerifiedCredential: true, expectListed: true },
    { status: "approved" as const, hasVerifiedCredential: false, expectListed: false },
    { status: "pending_review" as const, hasVerifiedCredential: true, expectListed: false },
    { status: "rejected" as const, hasVerifiedCredential: true, expectListed: false },
    { status: "draft" as const, hasVerifiedCredential: true, expectListed: false },
    { status: "draft" as const, hasVerifiedCredential: false, expectListed: false },
  ])("status=$status verified=$hasVerifiedCredential → $expectListed", ({ status, hasVerifiedCredential, expectListed }) => {
    expect(isProfessionallyListed({ status, hasVerifiedCredential })).toBe(expectListed);
  });
});