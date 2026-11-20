import { test, expect } from "@playwright/test";

test.describe("panel de cobros profesional", () => {
  test.skip(!process.env["E2E_BILLING"], "Definir E2E_BILLING=1 con DB migrada y login pro");

  test("carga la ruta de cobros", async ({ page }) => {
    await page.goto("/profesional/cobros");
    expect(page.url()).toContain("cobros");
  });
});
