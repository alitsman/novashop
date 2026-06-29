import type { DeliveryMethod, PaymentMethod } from "./checkout";

export type OrderItem = {
  productId: string;
  title: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: string;
  orderNumber: number;
  userId: string;
  items: OrderItem[];
  totalPrice: number;
  fullName: string;
  phone: string;
  address: string;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  createdAt: string;
};

export type CreateOrderPayload = {
  userId: string;
  items: OrderItem[];
  totalPrice: number;
  fullName: string;
  phone: string;
  address: string;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
};
