import type { Request, RequestHandler } from "express";

import type { OrderIdParams } from "./orderSchema.js";
import { createNewOrder, getOrderByIdForUser, getOrdersForUser } from "./orderService.js";
import type { CreateOrderInput, Order } from "./orderTypes.js";

const getAuthenticatedUserId = (request: Request): string => {
  const auth = request.auth;

  if (auth === undefined) {
    throw new Error("Authenticated request is missing auth context");
  }

  return auth.userId;
};

export const createOrder: RequestHandler<Record<string, never>, Order, CreateOrderInput> = async (
  request,
  response,
) => {
  const userId = getAuthenticatedUserId(request);
  const order = await createNewOrder(userId, request.body);

  response.status(201).json(order);
};

export const getOrders: RequestHandler<Record<string, never>, Order[]> = async (
  request,
  response,
) => {
  const userId = getAuthenticatedUserId(request);
  const orders = await getOrdersForUser(userId);

  response.status(200).json(orders);
};

export const getOrderById: RequestHandler<OrderIdParams, Order> = async (request, response) => {
  const userId = getAuthenticatedUserId(request);
  const order = await getOrderByIdForUser(request.params.id, userId);

  response.status(200).json(order);
};
