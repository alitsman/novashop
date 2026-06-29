import type { CreateOrderPayload, Order } from "../types/order";
import { storage } from "../utils/storage";
import { delay } from "../utils/delay";

const ORDERS_STORAGE_KEY = "novashop-orders";

const createOrderId = (): string => {
  return `order-${crypto.randomUUID()}`;
};

const getStoredOrders = (): Order[] => {
  return storage.getItem<Order[]>(ORDERS_STORAGE_KEY, []);
};

const saveStoredOrders = (orders: Order[]): void => {
  storage.setItem<Order[]>(ORDERS_STORAGE_KEY, orders);
};

const getNextOrderNumberForUser = (orders: Order[], userId: string): number => {
  const userOrderNumbers = orders
    .filter((order) => order.userId === userId)
    .map((order) => order.orderNumber)
    .filter((orderNumber): orderNumber is number => {
      return typeof orderNumber === "number";
    });

  if (userOrderNumbers.length === 0) {
    return 1;
  }

  return Math.max(...userOrderNumbers) + 1;
};

export const ordersService = {
  async createOrder(data: CreateOrderPayload): Promise<Order> {
    await delay();

    const orders = getStoredOrders();

    const newOrder: Order = {
      id: createOrderId(),
      orderNumber: getNextOrderNumberForUser(orders, data.userId),
      ...data,
      createdAt: new Date().toISOString(),
    };

    const updatedOrders = [...orders, newOrder];

    saveStoredOrders(updatedOrders);

    return newOrder;
  },

  async getMyOrders(userId: string): Promise<Order[]> {
    await delay();

    const orders = getStoredOrders();

    return orders
      .filter((order) => order.userId === userId)
      .sort((firstOrder, secondOrder) => {
        return secondOrder.createdAt.localeCompare(firstOrder.createdAt);
      });
  },
};
