import { DeliveryMethod, PaymentMethod } from "../types";
import { REGULAR_USER } from "./account.data";

import type { Order } from "../types";

export const ORDERS_REFERENCE_ORDER: Order = {
  id: "33333333-3333-4333-8333-333333333331",
  orderNumber: 1001,
  userId: REGULAR_USER.user.id,
  items: [
    {
      productId: "44444444-4444-4444-8444-444444444441",
      title: "Wireless Headphones",
      price: 19.99,
      quantity: 1,
    },
    {
      productId: "44444444-4444-4444-8444-444444444442",
      title: "USB-C Cable",
      price: 12.5,
      quantity: 2,
    },
  ],
  totalPrice: 44.99,
  fullName: "Ivan Ivanov",
  phone: "+995 555 123 456",
  address: "123 Test Street",
  deliveryMethod: DeliveryMethod.Standard,
  paymentMethod: PaymentMethod.Cash,
  createdAt: "2026-09-20T10:15:00.000Z",
};

export const ORDERS_OLDER_ORDER: Order = {
  id: "33333333-3333-4333-8333-333333333332",
  orderNumber: 1000,
  userId: REGULAR_USER.user.id,
  items: [
    {
      productId: "44444444-4444-4444-8444-444444444443",
      title: "Laptop Stand",
      price: 29.5,
      quantity: 1,
    },
  ],
  totalPrice: 29.5,
  fullName: "Maria Petrova",
  phone: "+995 555 987 654",
  address: "456 Test Avenue",
  deliveryMethod: DeliveryMethod.Express,
  paymentMethod: PaymentMethod.Card,
  createdAt: "2026-09-19T08:30:00.000Z",
};
