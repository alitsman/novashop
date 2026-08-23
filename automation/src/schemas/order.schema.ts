import { z } from "zod";

import { DeliveryMethod, PaymentMethod } from "../types";

import type { Order, OrderItem } from "../types";

const orderItemSchema: z.ZodType<OrderItem> = z
  .object({
    productId: z.uuid(),
    title: z.string().min(1),
    price: z.number().positive(),
    quantity: z.number().int().positive(),
  })
  .strict();

export const orderSchema: z.ZodType<Order> = z
  .object({
    id: z.uuid(),
    orderNumber: z.number().int().positive(),
    userId: z.uuid(),
    items: z.array(orderItemSchema).min(1),
    totalPrice: z.number().positive(),
    fullName: z.string().min(1),
    phone: z.string().min(1),
    address: z.string().min(1),
    deliveryMethod: z.enum([DeliveryMethod.Standard, DeliveryMethod.Express]),
    paymentMethod: z.enum([PaymentMethod.Cash, PaymentMethod.Card]),
    createdAt: z.iso.datetime(),
  })
  .strict();

export const orderListSchema = z.array(orderSchema);
