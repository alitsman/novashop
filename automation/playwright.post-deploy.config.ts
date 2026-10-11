import { defineConfig } from "@playwright/test";

const requireHttpsUrl = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for post-deploy smoke.`);
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid HTTPS URL.`);
  }

  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
    throw new Error(`${name} must be a public HTTPS origin.`);
  }

  if (url.pathname !== "/") {
    throw new Error(`${name} must contain only an origin.`);
  }

  return url.origin;
};

const requireSecret = (name: string): void => {
  if (!process.env[name]) {
    throw new Error(`${name} is required for post-deploy smoke.`);
  }
};

const frontendUrl = requireHttpsUrl("DEMO_FRONTEND_URL");
requireHttpsUrl("DEMO_API_URL");
requireSecret("SMOKE_USER_EMAIL");
requireSecret("SMOKE_USER_PASSWORD");

export default defineConfig({
  testDir: "./tests/post-deploy",
  // Waits for a sleeping Render Free backend before any test starts.
  globalSetup: "./tests/post-deploy/global-setup.ts",
  forbidOnly: !!process.env.CI,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  outputDir: "test-results/post-deploy",
  // HTML reports expose locator.fill() values, including passwords.
  // CI artifacts are public, so CI uses only the list reporter.
  reporter: process.env.CI
    ? [["list"]]
    : [["list"], ["html", { open: "never", outputFolder: "playwright-report/post-deploy" }]],
  use: {
    baseURL: frontendUrl,
    screenshot: "only-on-failure",
    trace: "off",
    video: "off",
    navigationTimeout: 20_000,
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: "post-deploy-api",
      testMatch: "**/api.spec.ts",
    },
    {
      name: "post-deploy-chromium",
      testMatch: "**/ui.spec.ts",
      use: {
        browserName: "chromium",
      },
    },
  ],
});
