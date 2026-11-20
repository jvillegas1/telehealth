import { expect, test } from "@playwright/test";

test.setTimeout(45_000);

/** Rutas públicas sin DB (REQ-QA-01, REQ-ETH-09). */
const PUBLIC_ROUTES = [
  "/",
  "/privacidad",
  "/consentimiento",
  "/ingreso",
  "/registro",
  "/autoevaluacion",
] as const;

const ALARM_PATTERNS = [
  /\b¡{2,}/,
  /urgente/i,
  /última oportunidad/i,
  /no te lo pierdas/i,
  /lorem ipsum/i,
];

for (const route of PUBLIC_ROUTES) {
  test(`smoke ${route}`, async ({ page }) => {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.ok() ?? true).toBeTruthy();
    await expect(page.locator("main")).toBeVisible();
    const text = (await page.locator("main").innerText()).toLowerCase();
    expect(text).not.toContain("lorem ipsum");
    for (const pattern of ALARM_PATTERNS) {
      expect(text).not.toMatch(pattern);
    }
  });
}

test("flujo profesional — página de ingreso", async ({ page }) => {
  await page.goto("/ingreso");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: /continuar/i })).toBeVisible();
});
