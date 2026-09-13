import type { Product } from "../types";

type CatalogProductOverrides = Pick<Product, "id" | "title" | "price" | "category"> &
  Partial<Product>;

type QuantityProductOverrides = CatalogProductOverrides & Pick<Product, "stock">;

export const CATALOG_REFERENCE_PRODUCT: CatalogProductOverrides = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3",
  title: "Mechanical Keyboard",
  description: "A comfortable keyboard for everyday work.",
  price: 69.99,
  category: "Electronics",
};

export const CATALOG_PRODUCTS: CatalogProductOverrides[] = [
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
    title: "Wireless Mouse",
    price: 49.99,
    category: "Electronics",
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
    title: "Gaming Mouse",
    price: 89.99,
    category: "Electronics",
  },
  CATALOG_REFERENCE_PRODUCT,
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4",
    title: "Computer Mouse Handbook",
    price: 29.99,
    category: "Books",
  },
];

export const EMPTY_CATALOG_PRODUCTS: Product[] = [];

export const QUANTITY_PRODUCT: QuantityProductOverrides = {
  id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc1",
  title: "Quantity Test Product",
  price: 49.99,
  category: "Electronics",
  stock: 5,
};

export const OUT_OF_STOCK_PRODUCT: QuantityProductOverrides = {
  id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc2",
  title: "Out of Stock Product",
  price: 49.99,
  category: "Electronics",
  stock: 0,
};

export const QUANTITY_PRODUCTS: QuantityProductOverrides[] = [
  QUANTITY_PRODUCT,
  OUT_OF_STOCK_PRODUCT,
];
