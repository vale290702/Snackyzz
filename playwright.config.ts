import { defineConfig, devices } from "@playwright/test";

const port = process.env.PORT ?? "5174";
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  use: {
    baseURL,
    locale: "es-CR",
    timezoneId: "America/Costa_Rica",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run dev",
    env: { PORT: port },
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
