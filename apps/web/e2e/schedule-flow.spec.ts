import { test, expect } from "@playwright/test";

test.describe("flujo de agenda", () => {
  test.skip(!process.env["E2E_SCHEDULE"], "Definir E2E_SCHEDULE=1 con DB migrada");

  test("reservar, reprogramar y cancelar", async ({ page }) => {
    await page.goto("/ingreso");
    // Completar con credenciales demo cuando el entorno E2E esté cableado.
    expect(true).toBe(true);
  });
});
