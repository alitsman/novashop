import type { PoolClient } from "pg";

import { env } from "../config/env.js";

import { pool } from "./pool.js";
import { assertTestDatabaseUrl } from "./testDatabaseGuard.js";

const recreatePublicSchema = async (client: PoolClient): Promise<void> => {
  try {
    await client.query("BEGIN");

    // Dropping public also removes extensions installed in it.
    // Migration 001 recreates pgcrypto before creating the tables.
    await client.query("DROP SCHEMA public CASCADE");
    await client.query("CREATE SCHEMA public AUTHORIZATION CURRENT_USER");

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  }
};

const recreateTestSchema = async (): Promise<void> => {
  const client = await pool.connect();

  try {
    await recreatePublicSchema(client);
  } finally {
    client.release();
  }
};

try {
  assertTestDatabaseUrl(env.databaseUrl);

  await recreateTestSchema();

  console.log("Test database schema recreated.");
} catch (error) {
  console.error("Test database schema recreation failed.");
  console.error(error);

  process.exitCode = 1;
} finally {
  await pool.end();
}
