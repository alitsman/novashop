import { DeliveryMethod, PaymentMethod } from "../types";

import type { CreateOrderInput, CreateOrderItemInput } from "../types";

const DEFAULT_ORDER_DETAILS: Omit<CreateOrderInput, "items"> = {
  fullName: "Test User",
  phone: "+995 123 456 7890",
  address: "123 Test Street",
  deliveryMethod: DeliveryMethod.Standard,
  paymentMethod: PaymentMethod.Card,
};

export function createOrderInput(
  items: CreateOrderItemInput[],
  overrides: Partial<Omit<CreateOrderInput, "items">> = {},
): CreateOrderInput {
  return {
    items,
    ...DEFAULT_ORDER_DETAILS,
    ...overrides,
  };
}

export function createOrderItemInput(productId: string, quantity: number): CreateOrderItemInput {
  return { productId, quantity };
}
