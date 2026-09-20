import { defineConfig, devices } from "@playwright/test";

/**
 * E2E configuration.
 *
 * Runs against the production build (`next build && next start`), not the dev
 * server, so what is tested is what ships — dev-only behaviour like unminified
 * React warnings and eager recompilation can mask real problems.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run build && npx next start --port 3100",
        port: 3100,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
