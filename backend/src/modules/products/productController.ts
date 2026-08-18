import type { RequestHandler } from "express";

import type { ProductIdParams } from "./productSchema.js";
import { getActiveProductById, getActiveProducts } from "./productService.js";
import type { Product } from "./productTypes.js";

export const getProducts: RequestHandler<Record<string, never>, Product[]> = async (
  _request,
  response,
) => {
  const products = await getActiveProducts();

  response.status(200).json(products);
};

export const getProductById: RequestHandler<ProductIdParams, Product> = async (
  request,
  response,
) => {
  const product = await getActiveProductById(request.params.id);

  response.status(200).json(product);
};
