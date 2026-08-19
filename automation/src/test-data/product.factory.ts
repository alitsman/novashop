import type { Product } from "../types";

const DEFAULT_PRODUCT: Product = {
  id: "00000000-0000-4000-8000-000000000001",
  title: "Test Product",
  price: 9.99,
  category: "Test",
  imageUrl: "https://images.unsplash.com/photo-1740818575352-5ce11f93c5e3",
  description: "A product created for automated tests.",
  stock: 10,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export function createProduct(overrides: Partial<Product> = {}): Product {
  return {
    ...DEFAULT_PRODUCT,
    ...overrides,
  };
}
