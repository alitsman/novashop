import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { PoolClient } from "pg";

import { pool } from "./pool.js";

const MIGRATIONS_DIRECTORY = resolve(process.cwd(), "migrations");

type AppliedMigrationRow = {
  filename: string;
};

const createSchemaMigrationsTable = async (client: PoolClient): Promise<void> => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
};

const getMigrationFiles = async (): Promise<string[]> => {
  const entries = await readdir(MIGRATIONS_DIRECTORY, {
    withFileTypes: true,
  });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort();
};

const getAppliedMigrations = async (client: PoolClient): Promise<Set<string>> => {
  const result = await client.query<AppliedMigrationRow>("SELECT filename FROM schema_migrations;");

  return new Set(result.rows.map((row) => row.filename));
};

const applyMigration = async (client: PoolClient, filename: string): Promise<void> => {
  const migrationPath = join(MIGRATIONS_DIRECTORY, filename);
  const migrationSql = await readFile(migrationPath, "utf8");

  await client.query("BEGIN");

  try {
    await client.query(migrationSql);

    await client.query("INSERT INTO schema_migrations (filename) VALUES ($1);", [filename]);

    await client.query("COMMIT");

    console.log(`Applied migration: ${filename}`);
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  }
};

const runMigrations = async (): Promise<void> => {
  const client = await pool.connect();

  try {
    await createSchemaMigrationsTable(client);

    const migrationFiles = await getMigrationFiles();
    const appliedMigrations = await getAppliedMigrations(client);

    const pendingMigrations = migrationFiles.filter((filename) => !appliedMigrations.has(filename));

    if (pendingMigrations.length === 0) {
      console.log("No pending migrations.");

      return;
    }

    for (const filename of pendingMigrations) {
      await applyMigration(client, filename);
    }

    console.log("Migrations completed.");
  } finally {
    client.release();
  }
};

try {
  await runMigrations();
} catch (error) {
  console.error("Migration failed.");
  console.error(error);

  process.exitCode = 1;
} finally {
  await pool.end();
}
