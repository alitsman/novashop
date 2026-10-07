import { defineConfig } from "@playwright/test";

import {
  createSharedConfig,
  frontendPort,
  frontendUrl,
  getSelectedBrowsers,
  getTestSelectionGrep,
} from "./src/config/playwright.shared";
import type { IsolatedApiGuardOptions } from "./src/fixtures/ui.fixture";

const testSelectionGrep = getTestSelectionGrep();

const uiProjects = getSelectedBrowsers().map((browserName) => ({
  name: `ui-${browserName}`,
  testMatch: "ui/**/*.spec.ts",
  grep: testSelectionGrep,
  use: {
    browserName,
    isolatedApiGuard: true,
  },
}));

export default defineConfig<IsolatedApiGuardOptions>({
  ...createSharedConfig({
    outputDir: "test-results/isolated-ui",
    htmlOutputFolder: "playwright-report/isolated-ui",
  }),

  projects: uiProjects,

  webServer: {
    command: `npm --prefix ../frontend run dev -- --port ${frontendPort}`,
    url: frontendUrl,
    reuseExistingServer: false,
  },
});
