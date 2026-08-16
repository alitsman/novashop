import { env } from "../config/env.js";

import { pool } from "./pool.js";
import { assertTestDatabaseUrl } from "./testDatabaseGuard.js";

const truncateApplicationTables = async (): Promise<void> => {
  await pool.query(`
    TRUNCATE TABLE
      public.order_items,
      public.orders,
      public.products,
      public.users
    RESTART IDENTITY CASCADE;
  `);
};

try {
  assertTestDatabaseUrl(env.databaseUrl);

  await truncateApplicationTables();

  console.log("Test database tables truncated.");
} catch (error) {
  console.error("Test database truncation failed.");
  console.error(error);

  process.exitCode = 1;
} finally {
  await pool.end();
}
