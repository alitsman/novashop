import { Router } from "express";

import { requireAuth, validateParams, validateRequest } from "../../middleware/index.js";

import { createOrder, getOrderById, getOrders } from "./orderController.js";
import { createOrderSchema, orderIdParamsSchema } from "./orderSchema.js";

export const orderRouter = Router();

orderRouter.use(requireAuth);

orderRouter.post("/", validateRequest(createOrderSchema), createOrder);

orderRouter.get("/", getOrders);

orderRouter.get("/:id", validateParams(orderIdParamsSchema), getOrderById);
