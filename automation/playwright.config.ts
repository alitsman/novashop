import { defineConfig } from "@playwright/test";

import {
  apiPort,
  apiUrl,
  createSharedConfig,
  frontendPort,
  frontendUrl,
  getRequiredEnv,
} from "./src/config/playwright.shared";

const backendPort = getRequiredEnv("PORT");

getRequiredEnv("DATABASE_URL");
getRequiredEnv("JWT_SECRET");

if (apiPort !== backendPort) {
  throw new Error(`PORT (${backendPort}) must match the port in API_URL (${apiPort})`);
}

const backendHealthUrl = new URL("/health", apiUrl).toString();

export default defineConfig({
  ...createSharedConfig({
    outputDir: "test-results/integrated",
    htmlOutputFolder: "playwright-report/integrated",
  }),

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
        baseURL: apiUrl,
      },
    },
    {
      name: "db",
      testMatch: "db/**/*.spec.ts",
      dependencies: ["database-setup"],
      use: {
        baseURL: apiUrl,
      },
    },
    {
      name: "hybrid-chromium",
      testMatch: "hybrid/**/*.spec.ts",
      dependencies: ["database-setup"],
      use: {
        browserName: "chromium",
      },
    },
    {
      name: "e2e-chromium",
      testMatch: "e2e/**/*.spec.ts",
      dependencies: ["database-setup"],
      use: {
        browserName: "chromium",
      },
    },
  ],

  webServer: [
    {
      command: `npm --prefix ../frontend run dev -- --port ${frontendPort}`,
      url: frontendUrl,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm --prefix ../backend run dev:test",
      url: backendHealthUrl,
      reuseExistingServer: false,
    },
  ],
});
