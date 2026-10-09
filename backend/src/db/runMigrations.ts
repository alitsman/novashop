import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { PoolClient } from "pg";

import { pool } from "./pool.js";

const MIGRATIONS_DIRECTORY = resolve(process.cwd(), "migrations");

// Any fixed number works as long as no other code uses it for its own advisory lock.
// Two processes that migrate the same database wait for each other on this key.
const MIGRATIONS_ADVISORY_LOCK_KEY = 4_726_391_001;

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
    // A failed ROLLBACK must not hide the error that caused it.
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(`Rollback failed for migration: ${filename}`);
      console.error(rollbackError);
    }

    throw error;
  }
};

const applyPendingMigrations = async (client: PoolClient): Promise<void> => {
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
};

const runMigrations = async (): Promise<void> => {
  const client = await pool.connect();

  try {
    // The advisory lock belongs to this connection (session), so the lock and all
    // migration queries must use the same client, not separate pool.query() calls.
    // pg_advisory_lock waits until another migration process releases the lock.
    // That process has applied everything by then, so this one finds nothing pending.
    await client.query("SELECT pg_advisory_lock($1);", [MIGRATIONS_ADVISORY_LOCK_KEY]);

    try {
      await applyPendingMigrations(client);
    } finally {
      // PostgreSQL also releases the lock when the connection closes. An unlock error
      // is only logged, so it does not hide a migration error.
      try {
        await client.query("SELECT pg_advisory_unlock($1);", [MIGRATIONS_ADVISORY_LOCK_KEY]);
      } catch (unlockError) {
        console.error("Failed to release the migration lock.");
        console.error(unlockError);
      }
    }
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
