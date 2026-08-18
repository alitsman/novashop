import { Router } from "express";

import { requireAuth, validateParams } from "../../middleware/index.js";

import { getProductById, getProducts } from "./productController.js";
import { productIdParamsSchema } from "./productSchema.js";

export const productRouter = Router();

productRouter.use(requireAuth);

productRouter.get("/", getProducts);
productRouter.get("/:id", validateParams(productIdParamsSchema), getProductById);
