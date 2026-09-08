import type { CartItem, Product } from "../types";

type CartItemOverrides = Partial<Pick<CartItem, "quantity">>;

export function createCartItem(product: Product, overrides: CartItemOverrides = {}): CartItem {
  return {
    productId: product.id,
    title: product.title,
    price: product.price,
    imageUrl: product.imageUrl,
    stock: product.stock,
    quantity: 1,
    ...overrides,
  };
}
