import type { Page } from "@playwright/test";

import { apiUrl } from "../config/playwright.shared";
import { productListSchema } from "../schemas";
import { holdRequestUntilReleased } from "./held-request.helper";

import type { Product } from "../types";
import type { HeldRequestController } from "./held-request.helper";

const PRODUCTS_API_URL = new URL("/products", apiUrl).toString();

export async function prepareProductCatalog(page: Page, products: Product[]): Promise<void> {
  const validatedProducts = productListSchema.parse(products);

  await page.route(PRODUCTS_API_URL, async (route) => {
    if (route.request().method() !== "GET") {
      await route.abort();

      return;
    }

    await route.fulfill({
      status: 200,
      json: validatedProducts,
    });
  });
}

export async function holdProductCatalogUntilReleased(
  page: Page,
  products: Product[],
): Promise<HeldRequestController> {
  const validatedProducts = productListSchema.parse(products);

  return holdRequestUntilReleased(page, {
    url: PRODUCTS_API_URL,
    method: "GET",
    fulfillWith: {
      status: 200,
      json: validatedProducts,
    },
  });
}

export async function prepareProductCatalogNetworkFailure(page: Page): Promise<void> {
  await page.route(PRODUCTS_API_URL, async (route) => {
    await route.abort("connectionfailed");
  });
}
