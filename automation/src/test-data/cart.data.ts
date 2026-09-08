import { createProduct } from "./product.factory";

export const CART_PRODUCT_A = createProduct({
  id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1",
  title: "Cart Product A",
  price: 49.99,
  stock: 5,
});

export const CART_PRODUCT_B = createProduct({
  id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2",
  title: "Cart Product B",
  price: 19.99,
  stock: 3,
});

export const CART_PRODUCTS = [CART_PRODUCT_A, CART_PRODUCT_B];
