import { describe, expect, it } from "vitest";

import { isCountryLaunched } from "../launch";

describe("isCountryLaunched", () => {
  it("bloquea países inactivos", () => {
    expect(isCountryLaunched(false)).toBe(false);
  });

  it("permite países activos", () => {
    expect(isCountryLaunched(true)).toBe(true);
  });
});
