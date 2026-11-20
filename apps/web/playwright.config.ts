import { defineConfig, devices } from "@playwright/test";

/**
 * E2E multi-navegador y móvil (REQ-QA-01, Etapa 10 §6.3).
 * Suite smoke/a11y no requiere Postgres. Flujos con DB usan flags E2E_*.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "playwright-report/results.json" }],
  ],
  use: {
    baseURL: process.env["PLAYWRIGHT_BASE_URL"] ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: process.env["PLAYWRIGHT_SKIP_WEBSERVER"]
    ? undefined
    : {
        command: "pnpm start",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        cwd: ".",
        env: {
          APP_ENV: "development",
          NODE_ENV: "production",
          NEXT_PUBLIC_APP_URL: "http://localhost:3000",
          PAYMENT_MODE: "sandbox",
          AUTH_SECRET: "development-only-auth-secret-32chars!",
          MOCK_CLAUDE: "1",
        },
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "edge",
      use:
        process.platform === "win32"
          ? { ...devices["Desktop Edge"], channel: "msedge" }
          : { ...devices["Desktop Edge"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 12"] },
    },
  ],
});
