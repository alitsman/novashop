import { pool } from "../../db/index.js";
import { AppError } from "../../errors/index.js";

import { mapProductRowToProduct } from "./productMapper.js";
import type { Product, ProductDbRow, ProductInput } from "./productTypes.js";

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
    throw new Error("The database did not return the created product.");
  }

  return mapProductRowToProduct(productRow);
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
