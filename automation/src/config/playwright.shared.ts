import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

import type { PlaywrightTestConfig } from "@playwright/test";

const testEnvPath = new URL("../../../.env.test", import.meta.url);

// Local runs use the file; CI supplies the same variables through process.env.
if (existsSync(testEnvPath)) {
  loadEnvFile(testEnvPath);
}

export const getRequiredEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const getExplicitUrlPort = (name: string, value: string): string => {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid absolute URL`);
  }

  if (!url.port) {
    throw new Error(`${name} must include an explicit port while Playwright starts local servers`);
  }

  return url.port;
};

export const frontendUrl = getRequiredEnv("FRONTEND_URL");
export const apiUrl = getRequiredEnv("API_URL");

const viteApiUrl = getRequiredEnv("VITE_API_URL");

export const frontendPort = getExplicitUrlPort("FRONTEND_URL", frontendUrl);
export const apiPort = getExplicitUrlPort("API_URL", apiUrl);

if (viteApiUrl !== apiUrl) {
  throw new Error(`VITE_API_URL (${viteApiUrl}) must match API_URL (${apiUrl})`);
}

type SharedConfigOptions = {
  outputDir: string;
  htmlOutputFolder: string;
};

export const createSharedConfig = ({
  outputDir,
  htmlOutputFolder,
}: SharedConfigOptions): PlaywrightTestConfig => ({
  testDir: "./tests",

  forbidOnly: !!process.env.CI,

  retries: 0,

  outputDir,

  reporter: [["list"], ["html", { open: "never", outputFolder: htmlOutputFolder }]],

  use: {
    baseURL: frontendUrl,
    screenshot: "only-on-failure",
    viewport: {
      width: 1280,
      height: 720,
    },
    trace: "retain-on-failure",
  },
});
