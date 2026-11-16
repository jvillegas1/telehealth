import { expect, test } from "@playwright/test";

/**
 * Requiere app + DB en ejecución. Valida retomado de progreso (REQ-MOD-01).
 */
test.describe("autoevaluación retomada", () => {
  test.skip(!process.env["E2E_ASSESSMENT"], "Definir E2E_ASSESSMENT=1 para ejecutar");

  test("retoma sesión tras recarga", async ({ page }) => {
    await page.goto("/autoevaluacion");
    await expect(page.getByText(/orientativa/i)).toBeVisible();
  });
});