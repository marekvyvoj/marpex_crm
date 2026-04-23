import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "npm -w apps/api run build && node apps/api/dist/server.js",
      cwd: "../06_IMPLEMENTATION",
      url: "http://127.0.0.1:3005/api/health",
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "npm -w apps/web run dev -- --host 127.0.0.1 --port 4173",
      cwd: "../06_IMPLEMENTATION",
      url: "http://127.0.0.1:4173/login",
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});