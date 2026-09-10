import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npm run start --workspace @workspace/backend",
      port: 8787,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm run dev --workspace @workspace/frontend -- --port 4173",
      port: 4173,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
