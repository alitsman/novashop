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

export type SeedProductData = ProductInput & {
  id: string;
  deletedAt?: string;
};

export type ProductDbRow = {
  id: string;
  title: string;
  price: string;
  category: string;
  image_url: string;
  description: string;
  stock: number;
  created_at: Date;
  updated_at: Date;
};

export type ProductInsertData = {
  id: string;
  title: string;
  price: number;
  category: string;
  image_url: string;
  description: string;
  stock: number;
  deleted_at: string | null;
};
