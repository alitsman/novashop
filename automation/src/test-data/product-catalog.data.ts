import type { Product } from "../types";

type CatalogProductOverrides = Pick<Product, "id" | "title" | "price" | "category"> &
  Partial<Product>;

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
