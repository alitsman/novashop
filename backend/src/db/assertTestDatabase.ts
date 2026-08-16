import { env } from "../config/env.js";

import { assertTestDatabaseUrl } from "./testDatabaseGuard.js";

try {
  assertTestDatabaseUrl(env.databaseUrl);

  console.log("Test database guard passed.");
} catch (error) {
  console.error("Test database guard failed.");
  console.error(error);

  process.exitCode = 1;
}
