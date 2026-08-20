export type Product = {
  id: string;
  title: string;
  price: number;
  category: string;
  imageUrl: string;
  description: string;
  stock: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;
