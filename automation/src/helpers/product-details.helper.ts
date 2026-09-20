import type { Page } from "@playwright/test";

import { apiUrl } from "../config/playwright.shared";
import { apiErrorResponseSchema, productSchema } from "../schemas";
import { holdRequestUntilReleased } from "./held-request.helper";

import type { Product } from "../types";
import type { HeldRequestController } from "./held-request.helper";

const PRODUCT_NOT_FOUND_RESPONSE = apiErrorResponseSchema.parse({
  error: {
    code: "PRODUCT_NOT_FOUND",
    message: "Product not found",
  },
});

const PRODUCT_DETAILS_VALIDATION_FAILURE_RESPONSE = apiErrorResponseSchema.parse({
  error: {
    code: "VALIDATION_ERROR",
    message: "Request validation failed",
  },
});

const PRODUCT_DETAILS_SERVER_FAILURE_RESPONSE = apiErrorResponseSchema.parse({
  error: {
    code: "INTERNAL_SERVER_ERROR",
    message: "Internal server error",
  },
});

type ProductDetailsResponse = {
  status: number;
  json: unknown;
};

const buildProductDetailsApiUrl = (productId: string): string => {
  return new URL(`/products/${productId}`, apiUrl).toString();
};

async function prepareProductDetailsResponse(
  page: Page,
  productId: string,
  response: ProductDetailsResponse,
): Promise<void> {
  await page.route(buildProductDetailsApiUrl(productId), async (route) => {
    if (route.request().method() !== "GET") {
      await route.abort();

      return;
    }

    await route.fulfill({
      status: response.status,
      json: response.json,
    });
  });
}

export async function holdProductDetailsUntilReleased(
  page: Page,
  product: Product,
): Promise<HeldRequestController> {
  const validatedProduct = productSchema.parse(product);

  return holdRequestUntilReleased(page, {
    url: buildProductDetailsApiUrl(validatedProduct.id),
    method: "GET",
    fulfillWith: {
      status: 200,
      json: validatedProduct,
    },
  });
}

export async function prepareProductDetails(page: Page, product: Product): Promise<void> {
  const validatedProduct = productSchema.parse(product);

  await prepareProductDetailsResponse(page, validatedProduct.id, {
    status: 200,
    json: validatedProduct,
  });
}

export async function prepareProductDetailsNotFound(page: Page, productId: string): Promise<void> {
  await prepareProductDetailsResponse(page, productId, {
    status: 404,
    json: PRODUCT_NOT_FOUND_RESPONSE,
  });
}

export async function prepareProductDetailsServerFailure(
  page: Page,
  productId: string,
): Promise<void> {
  await prepareProductDetailsResponse(page, productId, {
    status: 500,
    json: PRODUCT_DETAILS_SERVER_FAILURE_RESPONSE,
  });
}

export async function prepareProductDetailsValidationFailure(
  page: Page,
  productId: string,
): Promise<void> {
  await prepareProductDetailsResponse(page, productId, {
    status: 400,
    json: PRODUCT_DETAILS_VALIDATION_FAILURE_RESPONSE,
  });
}
