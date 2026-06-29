export const ProductSortOrder = {
  Default: "default",
  PriceAsc: "price-asc",
  PriceDesc: "price-desc",
} as const;

export type ProductSortOrder =
  (typeof ProductSortOrder)[keyof typeof ProductSortOrder];

export type Product = {
  id: string;
  title: string;
  price: number;
  category: string;
  imageUrl: string;
  description: string;
  stock: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductInput = {
  title: string;
  price: number;
  category: string;
  imageUrl: string;
  description: string;
  stock: number;
};
