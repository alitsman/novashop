import type { Product, ProductInput } from "../types/product";
import { ApiError, apiRequest } from "./apiClient";

export const productsService = {
  async getProducts(): Promise<Product[]> {
    return apiRequest<Product[]>("/products", {
      requiresAuth: true,
    });
  },

  async getProductById(id: string): Promise<Product | null> {
    try {
      return await apiRequest<Product>(`/products/${encodeURIComponent(id)}`, {
        requiresAuth: true,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        const isProductNotFound = error.statusCode === 404 && error.code === "PRODUCT_NOT_FOUND";

        const isInvalidProductId = error.statusCode === 400 && error.code === "VALIDATION_ERROR";

        if (isProductNotFound || isInvalidProductId) {
          return null;
        }
      }

      throw error;
    }
  },

  async createProduct(data: ProductInput): Promise<Product> {
    return apiRequest<Product>("/products", {
      method: "POST",
      body: data,
      requiresAuth: true,
    });
  },

  async updateProduct(id: string, data: ProductInput): Promise<Product> {
    return apiRequest<Product>(`/products/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: data,
      requiresAuth: true,
    });
  },

  async deleteProduct(id: string): Promise<void> {
    await apiRequest<void>(`/products/${encodeURIComponent(id)}`, {
      method: "DELETE",
      requiresAuth: true,
    });
  },
};
