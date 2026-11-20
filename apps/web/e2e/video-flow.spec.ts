import { test, expect } from "@playwright/test";

test.describe("flujo de videollamada", () => {
  test.skip(!process.env["E2E_VIDEO"], "Definir E2E_VIDEO=1 con DB y MOCK_LIVEKIT=1");

  test("sala de espera responde", async ({ page }) => {
    await page.goto("/citas");
    expect(page.url()).toContain("citas");
  });
});
