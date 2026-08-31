import type { CreateOrderPayload, Order } from "../types/order";
import { storage } from "../utils/storage";
import { apiRequest } from "./apiClient";

const LEGACY_ORDERS_STORAGE_KEY = "novashop-orders";

export const ordersService = {
  async createOrder(data: CreateOrderPayload): Promise<Order> {
    return apiRequest<Order>("/orders", {
      method: "POST",
      body: data,
      requiresAuth: true,
    });
  },

  async getMyOrders(): Promise<Order[]> {
    return apiRequest<Order[]>("/orders", {
      requiresAuth: true,
    });
  },

  clearLegacyOrders(): void {
    storage.removeItem(LEGACY_ORDERS_STORAGE_KEY);
  },
};
