import { defineConfig } from "@playwright/test";

import { createSharedConfig, frontendPort, frontendUrl } from "./src/config/playwright.shared";
import type { IsolatedApiGuardOptions } from "./src/fixtures/ui.fixture";

export default defineConfig<IsolatedApiGuardOptions>({
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
        isolatedApiGuard: true,
      },
    },
  ],

  webServer: {
    command: `npm --prefix ../frontend run dev -- --port ${frontendPort}`,
    url: frontendUrl,
    reuseExistingServer: false,
  },
});
