import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

import { defineConfig } from "@playwright/test";

const backendTestEnvPath = new URL("../backend/.env.test", import.meta.url);

if (!process.env.JWT_SECRET && existsSync(backendTestEnvPath)) {
  loadEnvFile(backendTestEnvPath);
}

export default defineConfig({
  testDir: "./tests",

  forbidOnly: !!process.env.CI,

  retries: 0,

  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: "http://localhost:5173",
    screenshot: "only-on-failure",
    viewport: {
      width: 1280,
      height: 720,
    },
    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "database-setup",
      testMatch: "setup/**/*.setup.ts",
    },
    {
      name: "api",
      testMatch: "api/**/*.spec.ts",
      dependencies: ["database-setup"],
      use: {
        baseURL: "http://localhost:4001",
      },
    },
    {
      name: "chromium",
      testMatch: "ui/**/*.spec.ts",
      use: {
        browserName: "chromium",
      },
    },
  ],

  webServer: [
    {
      command: "npm --prefix ../frontend run dev",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm --prefix ../backend run dev:test",
      url: "http://localhost:4001/health",
      reuseExistingServer: false,
    },
  ],
});
