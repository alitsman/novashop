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
    title: "Travel Mouse",
    price: 19.99,
    category: "Accessories",
  },
  {
    id: "catalog-product-4",
    title: "Desk Lamp",
    price: 39.99,
    category: "Home",
  },
  {
    id: "catalog-product-5",
    title: "Floor Lamp",
    price: 59.99,
    category: "Home",
  },
  {
    id: "catalog-product-6",
    title: "TypeScript Guide",
    price: 29.99,
    category: "Books",
  },
];
