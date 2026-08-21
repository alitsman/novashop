import { pool } from "../../db/index.js";
import { AppError } from "../../errors/index.js";

import { mapProductRowToProduct } from "./productMapper.js";
import type { Product, ProductDbRow, ProductInput, ProductUpdateInput } from "./productTypes.js";

export const createNewProduct = async (input: ProductInput): Promise<Product> => {
  const result = await pool.query<ProductDbRow>(
    `
      INSERT INTO products (
        title,
        price,
        category,
        image_url,
        description,
        stock
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        title,
        price,
        category,
        image_url,
        description,
        stock,
        created_at,
        updated_at;
    `,
    [input.title, input.price, input.category, input.imageUrl, input.description, input.stock],
  );

  const productRow = result.rows[0];

  if (productRow === undefined) {
    // INSERT ... RETURNING without a row is an unexpected server failure.
    throw new Error("The database did not return the created product.");
  }

  return mapProductRowToProduct(productRow);
};

export const updateActiveProduct = async (
  productId: string,
  input: ProductUpdateInput,
): Promise<Product> => {
  // Editable columns are NOT NULL, so null safely means "keep the current value".
  const result = await pool.query<ProductDbRow>(
    `
      UPDATE products
      SET
        title = COALESCE($2, title),
        price = COALESCE($3, price),
        category = COALESCE($4, category),
        image_url = COALESCE($5, image_url),
        description = COALESCE($6, description),
        stock = COALESCE($7, stock),
        updated_at = NOW()
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING
        id,
        title,
        price,
        category,
        image_url,
        description,
        stock,
        created_at,
        updated_at;
    `,
    [
      productId,
      input.title ?? null,
      input.price ?? null,
      input.category ?? null,
      input.imageUrl ?? null,
      input.description ?? null,
      input.stock ?? null,
    ],
  );

  const productRow = result.rows[0];

  if (productRow === undefined) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }

  return mapProductRowToProduct(productRow);
};

export const deleteActiveProduct = async (productId: string): Promise<void> => {
  const result = await pool.query<{ id: string }>(
    `
      UPDATE products
      SET deleted_at = NOW()
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING id;
    `,
    [productId],
  );

  const deletedProductRow = result.rows[0];

  if (deletedProductRow === undefined) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }
};

export const getActiveProducts = async (): Promise<Product[]> => {
  const result = await pool.query<ProductDbRow>(`
    SELECT
      id,
      title,
      price,
      category,
      image_url,
      description,
      stock,
      created_at,
      updated_at
    FROM products
    WHERE deleted_at IS NULL
    ORDER BY created_at ASC, id ASC;
  `);

  return result.rows.map(mapProductRowToProduct);
};

export const getActiveProductById = async (productId: string): Promise<Product> => {
  const result = await pool.query<ProductDbRow>(
    `
      SELECT
        id,
        title,
        price,
        category,
        image_url,
        description,
        stock,
        created_at,
        updated_at
      FROM products
      WHERE id = $1
        AND deleted_at IS NULL;
    `,
    [productId],
  );

  const productRow = result.rows[0];

  if (productRow === undefined) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }

  return mapProductRowToProduct(productRow);
};
