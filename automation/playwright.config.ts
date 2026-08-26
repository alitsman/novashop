import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

import { defineConfig } from "@playwright/test";

const testEnvPath = new URL("../.env.test", import.meta.url);

// Local runs use the file; CI supplies the same variables through process.env.
if (existsSync(testEnvPath)) {
  loadEnvFile(testEnvPath);
}

const getRequiredEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const getExplicitUrlPort = (name: string, value: string): string => {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid absolute URL`);
  }

  if (!url.port) {
    throw new Error(
      `${name} must include an explicit port while Playwright starts local servers`,
    );
  }

  return url.port;
};

const frontendUrl = getRequiredEnv("FRONTEND_URL");
const apiUrl = getRequiredEnv("API_URL");
const backendPort = getRequiredEnv("PORT");

getRequiredEnv("DATABASE_URL");
getRequiredEnv("JWT_SECRET");

const frontendPort = getExplicitUrlPort("FRONTEND_URL", frontendUrl);
const apiPort = getExplicitUrlPort("API_URL", apiUrl);

if (apiPort !== backendPort) {
  throw new Error(
    `PORT (${backendPort}) must match the port in API_URL (${apiPort})`,
  );
}

const backendHealthUrl = new URL("/health", apiUrl).toString();

export default defineConfig({
  testDir: "./tests",

  forbidOnly: !!process.env.CI,

  retries: 0,

  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: frontendUrl,
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
      name: "chromium",
      testMatch: "ui/**/*.spec.ts",
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
