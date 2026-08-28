import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

const backendDirectory = fileURLToPath(new URL("../../../backend", import.meta.url));

// Reset the database once before all API tests.
test("reset test database", () => {
  expect(() => {
    execSync("npm run db:reset:test", {
      cwd: backendDirectory,
      stdio: "inherit",
    });
  }).not.toThrow();
});
