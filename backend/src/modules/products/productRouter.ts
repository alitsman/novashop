import { Router } from "express";

import {
  requireAuth,
  requireRole,
  validateParams,
  validateRequest,
} from "../../middleware/index.js";
import { UserRole } from "../users/index.js";

import { createProduct, getProductById, getProducts, updateProduct } from "./productController.js";
import {
  createProductSchema,
  productIdParamsSchema,
  updateProductSchema,
} from "./productSchema.js";

export const productRouter = Router();

productRouter.use(requireAuth);

productRouter.post(
  "/",
  requireRole(UserRole.Admin),
  validateRequest(createProductSchema),
  createProduct,
);

productRouter.patch(
  "/:id",
  requireRole(UserRole.Admin),
  validateParams(productIdParamsSchema),
  validateRequest(updateProductSchema),
  updateProduct,
);

productRouter.get("/", getProducts);
productRouter.get("/:id", validateParams(productIdParamsSchema), getProductById);
