import { describe, expect, it } from "vitest";

import { AdminInternalRole, AdminPermission, hasAdminPermission } from "@telehealth/domain";

describe("admin guard permissions matrix", () => {
  it("finance cannot moderate reviews", () => {
    expect(hasAdminPermission([AdminInternalRole.Finance], AdminPermission.ReviewsModerate)).toBe(
      false,
    );
  });

  it("verifier can review credentials", () => {
    expect(
      hasAdminPermission([AdminInternalRole.Verifier], AdminPermission.CredentialsReview),
    ).toBe(true);
  });
});
