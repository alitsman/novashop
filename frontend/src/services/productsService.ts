import { mockProducts } from "../data/mockProducts";
import type { Product, ProductInput } from "../types/product";
import { delay } from "../utils/delay";
import { storage } from "../utils/storage";

const PRODUCTS_STORAGE_KEY = "novashop-products";

const seedStoredProducts = (): Product[] => {
  storage.setItem<Product[]>(PRODUCTS_STORAGE_KEY, mockProducts);

  return mockProducts;
};

const getStoredProducts = (): Product[] => {
  const storedProducts = storage.getItem<Product[] | null>(
    PRODUCTS_STORAGE_KEY,
    null,
  );

  if (!storedProducts) {
    return seedStoredProducts();
  }

  return storedProducts;
};

const saveStoredProducts = (products: Product[]): void => {
  storage.setItem<Product[]>(PRODUCTS_STORAGE_KEY, products);
};

const createProductId = (): string => {
  return crypto.randomUUID();
};

export const productsService = {
  async getProducts(): Promise<Product[]> {
    await delay();

    return getStoredProducts();
  },

  async getProductById(id: string): Promise<Product | null> {
    await delay();

    const products = getStoredProducts();

    return products.find((product) => product.id === id) ?? null;
  },

  async createProduct(data: ProductInput): Promise<Product> {
    await delay();

    const products = getStoredProducts();
    const now = new Date().toISOString();

    const newProduct: Product = {
      id: createProductId(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    const updatedProducts = [...products, newProduct];

    saveStoredProducts(updatedProducts);

    return newProduct;
  },

  async updateProduct(id: string, data: ProductInput): Promise<Product> {
    await delay();

    const products = getStoredProducts();
    const existingProduct = products.find((product) => product.id === id);

    if (!existingProduct) {
      throw new Error("Product not found");
    }

    const now = new Date().toISOString();

    const updatedProduct: Product = {
      ...existingProduct,
      ...data,
      updatedAt: now,
    };

    const updatedProducts = products.map((product) => {
      if (product.id === id) {
        return updatedProduct;
      }

      return product;
    });

    saveStoredProducts(updatedProducts);

    return updatedProduct;
  },

  async deleteProduct(id: string): Promise<void> {
    await delay();

    const products = getStoredProducts();
    const productExists = products.some((product) => product.id === id);

    if (!productExists) {
      throw new Error("Product not found");
    }

    const updatedProducts = products.filter((product) => product.id !== id);

    saveStoredProducts(updatedProducts);
  },
};
