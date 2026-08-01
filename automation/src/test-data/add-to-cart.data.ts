import type { Product } from "../types";

type AddToCartProductOverrides = Pick<
  Product,
  "id" | "title" | "description" | "price" | "category" | "stock"
> &
  Partial<Product>;

export const ADD_TO_CART_PRODUCT_A: AddToCartProductOverrides = {
  id: "add-to-cart-product-a",
  title: "Add To Cart Product A",
  description: "Description of product A.",
  price: 49.99,
  category: "Electronics",
  stock: 5,
};

export const ADD_TO_CART_PRODUCT_B: AddToCartProductOverrides = {
  id: "add-to-cart-product-b",
  title: "Add To Cart Product B",
  description: "Description of product B.",
  price: 19.99,
  category: "Books",
  stock: 3,
};

export const ADD_TO_CART_PRODUCTS = [
  ADD_TO_CART_PRODUCT_A,
  ADD_TO_CART_PRODUCT_B,
];
