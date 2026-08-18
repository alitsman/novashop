import type { Product, ProductDbRow, ProductInsertData, SeedProductData } from "./productTypes.js";

export const mapSeedProductToProductInsertData = (product: SeedProductData): ProductInsertData => {
  return {
    id: product.id,
    title: product.title,
    price: product.price,
    category: product.category,
    image_url: product.imageUrl,
    description: product.description,
    stock: product.stock,
    deleted_at: product.deletedAt ?? null,
  };
};

export const mapProductRowToProduct = (row: ProductDbRow): Product => {
  return {
    id: row.id,
    title: row.title,
    price: Number(row.price),
    category: row.category,
    imageUrl: row.image_url,
    description: row.description,
    stock: row.stock,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
};
