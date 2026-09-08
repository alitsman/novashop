import type { Product } from "../types";

type AddToCartProductOverrides = Pick<
  Product,
  "id" | "title" | "description" | "price" | "category" | "stock"
> &
  Partial<Product>;

export const ADD_TO_CART_PRODUCT_A: AddToCartProductOverrides = {
  id: "dddddddd-dddd-4ddd-8ddd-ddddddddddd1",
  title: "Add To Cart Product A",
  description: "Description of product A.",
  price: 49.99,
  category: "Electronics",
  stock: 5,
};

export const ADD_TO_CART_PRODUCT_B: AddToCartProductOverrides = {
  id: "dddddddd-dddd-4ddd-8ddd-ddddddddddd2",
  title: "Add To Cart Product B",
  description: "Description of product B.",
  price: 19.99,
  category: "Books",
  stock: 3,
};

export const ADD_TO_CART_PRODUCTS = [ADD_TO_CART_PRODUCT_A, ADD_TO_CART_PRODUCT_B];
