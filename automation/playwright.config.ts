import { defineConfig } from "@playwright/test";

import {
  apiPort,
  apiUrl,
  createSharedConfig,
  frontendPort,
  frontendUrl,
  getRequiredEnv,
  getSelectedBrowsers,
  getTestSelectionGrep,
} from "./src/config/playwright.shared";

const backendPort = getRequiredEnv("PORT");

getRequiredEnv("DATABASE_URL");
getRequiredEnv("JWT_SECRET");

if (apiPort !== backendPort) {
  throw new Error(`PORT (${backendPort}) must match the port in API_URL (${apiPort})`);
}

const backendHealthUrl = new URL("/health", apiUrl).toString();

const selectedBrowsers = getSelectedBrowsers();
const testSelectionGrep = getTestSelectionGrep();

const hybridProjects = selectedBrowsers.map((browserName) => ({
  name: `hybrid-${browserName}`,
  testMatch: "hybrid/**/*.spec.ts",
  grep: testSelectionGrep,
  dependencies: ["database-setup"],
  use: {
    browserName,
  },
}));

const e2eProjects = selectedBrowsers.map((browserName) => ({
  name: `e2e-${browserName}`,
  testMatch: "e2e/**/*.spec.ts",
  grep: testSelectionGrep,
  dependencies: ["database-setup"],
  use: {
    browserName,
  },
}));

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
      grep: testSelectionGrep,
      dependencies: ["database-setup"],
      use: {
        baseURL: apiUrl,
      },
    },
    {
      name: "db",
      testMatch: "db/**/*.spec.ts",
      grep: testSelectionGrep,
      dependencies: ["database-setup"],
      use: {
        baseURL: apiUrl,
      },
    },
    ...hybridProjects,
    ...e2eProjects,
  ],

  webServer: [
    {
      command: `npm --prefix ../frontend run dev -- --port ${frontendPort}`,
      url: frontendUrl,
      reuseExistingServer: false,
    },
    {
      command: "npm --prefix ../backend run dev:test",
      url: backendHealthUrl,
      reuseExistingServer: false,
    },
  ],
});
