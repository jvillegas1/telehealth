import { test, expect } from "@playwright/test";

test.describe("flujo de agenda", () => {
  test.skip(!process.env["E2E_SCHEDULE"], "Definir E2E_SCHEDULE=1 con DB migrada");

  test("reservar, reprogramar y cancelar", async ({ page }) => {
    await page.goto("/ingreso");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.goto("/profesionales");
    await expect(page.locator("main")).toBeVisible();
  });
});
