import { defineConfig } from "@playwright/test";

// Browser jobs run in containers while report merging runs on the host.
// A shared testDir allows Playwright to merge reports from different filesystem roots.
export default defineConfig({
  testDir: "./tests",
});
