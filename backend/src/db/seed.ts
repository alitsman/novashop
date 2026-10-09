import * as bcrypt from "bcrypt";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { PoolClient } from "pg";

// Import mappers and types from their own files, not from module index files.
// The module index files also export routers, which load config/env.ts and
// validate all application variables before the seed can check its own config.
import { mapSeedProductToProductInsertData } from "../modules/products/productMapper.js";
import type { ProductInsertData, SeedProductData } from "../modules/products/productTypes.js";
import { mapSeedUserToUserInsertData } from "../modules/users/userMapper.js";
import { UserRole } from "../modules/users/userTypes.js";
import type { SeedUserData, UserInsertData } from "../modules/users/userTypes.js";

import { assertTestDatabaseUrl } from "./testDatabaseGuard.js";

const BCRYPT_SALT_ROUNDS = 10;
const SEED_DATA_DIRECTORY = resolve(process.cwd(), "seed-data");

// Known passwords from users.json are allowed only with this flag and only for the test database.
const TEST_CREDENTIALS_FLAG = "--test-credentials";

// bcrypt uses only the first 72 bytes of a password, so generated passwords should stay below that.
const MIN_ADMIN_PASSWORD_LENGTH = 16;

type SeedConfig =
  { useTestCredentials: true } | { useTestCredentials: false; adminPassword: string };

// Validates arguments and environment before any database connection is opened.
const resolveSeedConfig = (): SeedConfig => {
  const args = process.argv.slice(2);

  if (args.length > 1 || (args.length === 1 && args[0] !== TEST_CREDENTIALS_FLAG)) {
    throw new Error("Unsupported seed arguments.");
  }

  if (args[0] === TEST_CREDENTIALS_FLAG) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for test seed.");
    }

    assertTestDatabaseUrl(databaseUrl);

    return { useTestCredentials: true };
  }

  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || adminPassword.length < MIN_ADMIN_PASSWORD_LENGTH) {
    throw new Error(
      `ADMIN_PASSWORD must contain at least ${MIN_ADMIN_PASSWORD_LENGTH} characters.`,
    );
  }

  return { useTestCredentials: false, adminPassword };
};

const readJsonFile = async <T>(filename: string): Promise<T> => {
  const filePath = resolve(SEED_DATA_DIRECTORY, filename);
  const fileContent = await readFile(filePath, "utf8");

  return JSON.parse(fileContent) as T;
};

const readSeedUsers = async (): Promise<SeedUserData[]> => {
  return readJsonFile<SeedUserData[]>("users.json");
};

const readSeedProducts = async (): Promise<SeedProductData[]> => {
  return readJsonFile<SeedProductData[]>("products.json");
};

// Test seed keeps all users from users.json.
// Regular seed creates only the admin, with the password from ADMIN_PASSWORD.
const selectSeedUsers = (users: SeedUserData[], config: SeedConfig): SeedUserData[] => {
  if (config.useTestCredentials) {
    return users;
  }

  const admin = users.find((user) => user.role === UserRole.Admin);

  if (!admin) {
    throw new Error("Admin user is missing from seed data.");
  }

  return [{ ...admin, password: config.adminPassword }];
};

const insertUser = async (client: PoolClient, user: UserInsertData): Promise<void> => {
  await client.query(
    `
      INSERT INTO users (id, name, email, password_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email)
      DO UPDATE SET
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        updated_at = NOW();
    `,
    [user.id, user.name, user.email, user.password_hash, user.role],
  );
};

const insertProduct = async (client: PoolClient, product: ProductInsertData): Promise<void> => {
  await client.query(
    `
      INSERT INTO products (
        id,
        title,
        price,
        category,
        image_url,
        description,
        stock,
        deleted_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id)
      DO UPDATE SET
        title = EXCLUDED.title,
        price = EXCLUDED.price,
        category = EXCLUDED.category,
        image_url = EXCLUDED.image_url,
        description = EXCLUDED.description,
        stock = EXCLUDED.stock,
        deleted_at = EXCLUDED.deleted_at,
        updated_at = NOW();
    `,
    [
      product.id,
      product.title,
      product.price,
      product.category,
      product.image_url,
      product.description,
      product.stock,
      product.deleted_at,
    ],
  );
};

const seedUsers = async (client: PoolClient, users: SeedUserData[]): Promise<void> => {
  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, BCRYPT_SALT_ROUNDS);
    const userInsertData = mapSeedUserToUserInsertData(user, passwordHash);

    await insertUser(client, userInsertData);
  }
};

const seedProducts = async (client: PoolClient, products: SeedProductData[]): Promise<void> => {
  for (const product of products) {
    const productInsertData = mapSeedProductToProductInsertData(product);

    await insertProduct(client, productInsertData);
  }
};

const runSeed = async (): Promise<void> => {
  const config = resolveSeedConfig();

  const users = selectSeedUsers(await readSeedUsers(), config);
  const products = await readSeedProducts();

  // pool.ts loads config/env.ts, which validates all application variables on import.
  // Importing it only after resolveSeedConfig() keeps seed configuration errors first.
  const { pool } = await import("./pool.js");

  // The outer finally closes the pool even when the connection itself fails.
  try {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await seedUsers(client, users);
      await seedProducts(client, products);

      await client.query("COMMIT");

      console.log(`Seeded users: ${users.length}`);
      console.log(`Seeded products: ${products.length}`);
      console.log("Seed completed.");
    } catch (error) {
      // A failed ROLLBACK must not hide the error that caused it.
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Seed rollback failed.");
        console.error(rollbackError);
      }

      throw error;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
};

try {
  await runSeed();
} catch (error) {
  console.error("Seed failed.");
  console.error(error);

  process.exitCode = 1;
}
