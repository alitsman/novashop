import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",

  reporter: "html",

  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
      },
    },
  ],

  webServer: {
    command: "npm --prefix ../frontend run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
  },
});
