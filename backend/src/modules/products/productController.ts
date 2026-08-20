import type { RequestHandler } from "express";

import type { ProductIdParams } from "./productSchema.js";
import { createNewProduct, getActiveProductById, getActiveProducts } from "./productService.js";
import type { Product, ProductInput } from "./productTypes.js";

export const createProduct: RequestHandler<Record<string, never>, Product, ProductInput> = async (
  request,
  response,
) => {
  const product = await createNewProduct(request.body);

  response.status(201).json(product);
};

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
