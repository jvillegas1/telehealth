import { describe, expect, it } from "vitest";

import { AdminInternalRole, AdminPermission, hasAdminPermission } from "../permissions";

describe("admin internal permissions", () => {
  it("verifier can review credentials but not suspend users", () => {
    expect(
      hasAdminPermission([AdminInternalRole.Verifier], AdminPermission.CredentialsReview),
    ).toBe(true);
    expect(hasAdminPermission([AdminInternalRole.Verifier], AdminPermission.UsersSuspend)).toBe(
      false,
    );
  });

  it("finance can export payments", () => {
    expect(hasAdminPermission([AdminInternalRole.Finance], AdminPermission.PaymentsExport)).toBe(
      true,
    );
    expect(hasAdminPermission([AdminInternalRole.Finance], AdminPermission.ReviewsModerate)).toBe(
      false,
    );
  });

  it("support can moderate reviews and suspend", () => {
    expect(hasAdminPermission([AdminInternalRole.Support], AdminPermission.ReviewsModerate)).toBe(
      true,
    );
    expect(hasAdminPermission([AdminInternalRole.Support], AdminPermission.UsersSuspend)).toBe(
      true,
    );
  });
});
