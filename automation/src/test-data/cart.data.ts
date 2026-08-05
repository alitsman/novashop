import type { CartItem } from "../types";

type CartItemOverrides = Pick<
  CartItem,
  "productId" | "title" | "price" | "quantity" | "stock"
> &
  Partial<CartItem>;

export const CART_ITEM_A: CartItemOverrides = {
  productId: "cart-product-a",
  title: "Cart Product A",
  price: 49.99,
  quantity: 2,
  stock: 5,
};

export const CART_ITEM_B: CartItemOverrides = {
  productId: "cart-product-b",
  title: "Cart Product B",
  price: 19.99,
  quantity: 1,
  stock: 3,
};

export const CART_ITEMS: CartItemOverrides[] = [CART_ITEM_A, CART_ITEM_B];
