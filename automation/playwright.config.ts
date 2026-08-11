import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",

  forbidOnly: !!process.env.CI,

  retries: 0,

  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: "http://localhost:5173",
    screenshot: "only-on-failure",
    viewport: {
      width: 1280,
      height: 720,
    },
    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "api",
      testMatch: "api/**/*.spec.ts",
      use: {
        baseURL: "http://localhost:4000",
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
      command: "npm --prefix ../frontend run dev",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm --prefix ../backend run dev",
      url: "http://localhost:4000/health",
      reuseExistingServer: !process.env.CI,
    },
  ],
});
