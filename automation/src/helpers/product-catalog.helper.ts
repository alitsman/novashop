import type { Page } from "@playwright/test";

import { apiUrl } from "../config/playwright.shared";
import { productListSchema } from "../schemas";

import type { Product } from "../types";

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
