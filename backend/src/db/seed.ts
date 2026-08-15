import * as bcrypt from "bcrypt";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { PoolClient } from "pg";

import { mapSeedProductToProductInsertData } from "../modules/products/index.js";
import type { ProductInsertData, SeedProductData } from "../modules/products/index.js";
import { mapSeedUserToUserInsertData } from "../modules/users/index.js";
import type { SeedUserData, UserInsertData } from "../modules/users/index.js";

import { pool } from "./pool.js";

const BCRYPT_SALT_ROUNDS = 10;
const SEED_DATA_DIRECTORY = resolve(process.cwd(), "seed-data");

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
        stock
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id)
      DO UPDATE SET
        title = EXCLUDED.title,
        price = EXCLUDED.price,
        category = EXCLUDED.category,
        image_url = EXCLUDED.image_url,
        description = EXCLUDED.description,
        stock = EXCLUDED.stock,
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
  const users = await readSeedUsers();
  const products = await readSeedProducts();

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
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
};

try {
  await runSeed();
} catch (error) {
  console.error("Seed failed.");
  console.error(error);

  process.exitCode = 1;
} finally {
  await pool.end();
}
