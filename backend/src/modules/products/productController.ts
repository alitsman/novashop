import type { RequestHandler } from "express";

import type { ProductIdParams } from "./productSchema.js";
import {
  createNewProduct,
  deleteActiveProduct,
  getActiveProductById,
  getActiveProducts,
  updateActiveProduct,
} from "./productService.js";
import type { Product, ProductInput, ProductUpdateInput } from "./productTypes.js";

export const createProduct: RequestHandler<Record<string, never>, Product, ProductInput> = async (
  request,
  response,
) => {
  const product = await createNewProduct(request.body);

  response.status(201).json(product);
};

export const updateProduct: RequestHandler<ProductIdParams, Product, ProductUpdateInput> = async (
  request,
  response,
) => {
  const product = await updateActiveProduct(request.params.id, request.body);

  response.status(200).json(product);
};

export const deleteProduct: RequestHandler<ProductIdParams, void> = async (request, response) => {
  await deleteActiveProduct(request.params.id);

  response.status(204).send();
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
