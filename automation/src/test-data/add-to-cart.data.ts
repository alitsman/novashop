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

export const QUANTITY_PRODUCT: AddToCartProductOverrides = {
  id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc1",
  title: "Quantity Test Product",
  description: "A product used to test quantity controls.",
  price: 49.99,
  category: "Electronics",
  stock: 5,
};

export const OUT_OF_STOCK_PRODUCT: AddToCartProductOverrides = {
  id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc2",
  title: "Out of Stock Product",
  description: "A product that is currently out of stock.",
  price: 49.99,
  category: "Electronics",
  stock: 0,
};

export const SINGLE_STOCK_PRODUCT: AddToCartProductOverrides = {
  id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc3",
  title: "Single Stock Product",
  description: "A product with one unit remaining.",
  price: 29.99,
  category: "Electronics",
  stock: 1,
};

export const STALE_CART_PRODUCT: AddToCartProductOverrides = {
  id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc4",
  title: "Stale Cart Product",
  description: "A product whose cart quantity exceeds its current stock.",
  price: 39.99,
  category: "Electronics",
  stock: 3,
};

export const ADD_TO_CART_PRODUCTS = [ADD_TO_CART_PRODUCT_A, ADD_TO_CART_PRODUCT_B];
