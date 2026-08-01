import type { Product } from "../types";

const DEFAULT_PRODUCT: Product = {
  id: "test-product",
  title: "Test Product",
  price: 9.99,
  category: "Test",
  imageUrl: "https://images.unsplash.com/photo-1740818575352-5ce11f93c5e3",
  description: "A product created for automated tests.",
  stock: 10,
};

export function createProduct(overrides: Partial<Product> = {}): Product {
  return {
    ...DEFAULT_PRODUCT,
    ...overrides,
  };
}
