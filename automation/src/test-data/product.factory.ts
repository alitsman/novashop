import type { Product, ProductInput } from "../types";

const DEFAULT_PRODUCT_INPUT: ProductInput = {
  title: "Test Product",
  price: 9.99,
  category: "Test",
  imageUrl: "https://images.unsplash.com/photo-1740818575352-5ce11f93c5e3",
  description: "A product created for automated tests.",
  stock: 10,
};

const DEFAULT_PRODUCT: Product = {
  id: "00000000-0000-4000-8000-000000000001",
  ...DEFAULT_PRODUCT_INPUT,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export function createProduct(overrides: Partial<Product> = {}): Product {
  return {
    ...DEFAULT_PRODUCT,
    ...overrides,
  };
}

export function createProductInput(overrides: Partial<ProductInput> = {}): ProductInput {
  return {
    ...DEFAULT_PRODUCT_INPUT,
    ...overrides,
  };
}
