import type { APIRequestContext } from "@playwright/test";

import { productSchema } from "../schemas";
import { createProductInput } from "../test-data";

import type { Product, ProductInput } from "../types";

// Creates an isolated product through the public API for tests that need setup
// data but do not test POST /products itself.
export async function createProductViaApi(
  request: APIRequestContext,
  token: string,
  overrides: Partial<ProductInput> = {},
): Promise<Product> {
  const response = await request.post("/products", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: createProductInput(overrides),
  });

  if (response.status() !== 201) {
    throw new Error(
      `Product setup failed: expected status 201, received ${response.status()}`,
    );
  }

  return productSchema.parse(await response.json());
}
