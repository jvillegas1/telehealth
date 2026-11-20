import { test, expect } from "@playwright/test";

test.describe("flujo admin credenciales", () => {
  test.skip(!process.env["E2E_ADMIN"], "Definir E2E_ADMIN=1 con DB migrada y roles admin");

  test("ruta de credenciales admin", async ({ page }) => {
    await page.goto("/admin/credenciales");
    expect(page.url()).toContain("credenciales");
  });
});
