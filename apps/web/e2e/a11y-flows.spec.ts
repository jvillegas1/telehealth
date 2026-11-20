import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** axe-core es estable en Chromium/WebKit; Firefox/Edge se cubren con smoke multi-navegador. */
const AXE_PROJECTS = new Set(["chromium", "webkit", "mobile-chrome", "mobile-safari"]);

const PATIENT_ROUTES = ["/", "/autoevaluacion", "/privacidad", "/consentimiento"] as const;
const PROFESSIONAL_ROUTES = ["/ingreso", "/registro"] as const;

test.beforeEach((_, testInfo) => {
  test.skip(!AXE_PROJECTS.has(testInfo.project.name), "axe solo en Chromium/WebKit");
});

test.setTimeout(60_000);

async function expectNoSeriousAxeViolations(page: import("@playwright/test").Page, route: string) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(serious, `axe en ${route}: ${JSON.stringify(serious, null, 2)}`).toEqual([]);
}

test.describe("accesibilidad paciente (axe)", () => {
  for (const route of PATIENT_ROUTES) {
    test(route, async ({ page }) => {
      await page.goto(route);
      await expectNoSeriousAxeViolations(page, route);
    });
  }
});

test.describe("accesibilidad profesional — acceso (axe)", () => {
  for (const route of PROFESSIONAL_ROUTES) {
    test(route, async ({ page }) => {
      await page.goto(route);
      await expectNoSeriousAxeViolations(page, route);
    });
  }
});
