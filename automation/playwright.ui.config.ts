import { defineConfig } from "@playwright/test";

import { createSharedConfig, frontendPort, frontendUrl } from "./src/config/playwright.shared";

export default defineConfig({
  ...createSharedConfig({
    outputDir: "test-results/isolated-ui",
    htmlOutputFolder: "playwright-report/isolated-ui",
  }),

  projects: [
    {
      name: "ui-chromium",
      testMatch: "ui/**/*.spec.ts",
      use: {
        browserName: "chromium",
      },
    },
  ],

  webServer: {
    command: `npm --prefix ../frontend run dev -- --port ${frontendPort}`,
    url: frontendUrl,
    reuseExistingServer: !process.env.CI,
  },
});
