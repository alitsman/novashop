import type { Page } from "@playwright/test";

import { apiUrl } from "../config/playwright.shared";
import { productSchema } from "../schemas";

import type { Product } from "../types";

export async function prepareProductDetails(page: Page, product: Product): Promise<void> {
  const validatedProduct = productSchema.parse(product);
  const productApiUrl = new URL(`/products/${validatedProduct.id}`, apiUrl).toString();

  await page.route(productApiUrl, async (route) => {
    if (route.request().method() !== "GET") {
      await route.abort();

      return;
    }

    await route.fulfill({
      status: 200,
      json: validatedProduct,
    });
  });
}
