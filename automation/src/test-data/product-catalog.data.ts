import type { Product } from "../types/product";

type CatalogProductOverrides = Pick<
  Product,
  "id" | "title" | "price" | "category"
> &
  Partial<Product>;

type QuantityProductOverrides = CatalogProductOverrides &
  Pick<Product, "stock">;

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

export const QUANTITY_PRODUCT: QuantityProductOverrides = {
  id: "quantity-product",
  title: "Quantity Test Product",
  price: 49.99,
  category: "Electronics",
  stock: 5,
};

export const OUT_OF_STOCK_PRODUCT: QuantityProductOverrides = {
  id: "out-of-stock-product",
  title: "Out of Stock Product",
  price: 49.99,
  category: "Electronics",
  stock: 0,
};

export const QUANTITY_PRODUCTS: QuantityProductOverrides[] = [
  QUANTITY_PRODUCT,
  OUT_OF_STOCK_PRODUCT,
];
