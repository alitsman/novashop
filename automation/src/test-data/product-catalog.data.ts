import type { Product } from "../types/product";

type CatalogProductOverrides = Pick<
  Product,
  "id" | "title" | "price" | "category"
> &
  Partial<Product>;

export const CATALOG_PRODUCTS: CatalogProductOverrides[] = [
  {
    id: "catalog-product-1",
    title: "Wireless Mouse",
    price: 49.99,
    category: "Electronics",
  },
  {
    id: "catalog-product-2",
    title: "Gaming Mouse",
    price: 89.99,
    category: "Electronics",
  },
  {
    id: "catalog-product-3",
    title: "Mechanical Keyboard",
    description: "A comfortable keyboard for everyday work.",
    price: 69.99,
    category: "Electronics",
  },
  {
    id: "catalog-product-4",
    title: "Computer Mouse Handbook",
    price: 29.99,
    category: "Books",
  },
];

export const EMPTY_CATALOG_PRODUCTS: Product[] = [];
