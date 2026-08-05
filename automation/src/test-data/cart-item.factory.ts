import type { CartItem } from "../types";

const DEFAULT_CART_ITEM: CartItem = {
  productId: "test-product",
  title: "Test Product",
  price: 9.99,
  imageUrl: "https://images.unsplash.com/photo-1740818575352-5ce11f93c5e3",
  quantity: 1,
  stock: 10,
};

export function createCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    ...DEFAULT_CART_ITEM,
    ...overrides,
  };
}
