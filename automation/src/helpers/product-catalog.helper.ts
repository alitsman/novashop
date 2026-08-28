import type { Page } from "@playwright/test";

import type { Product } from "../types";

const PRODUCTS_STORAGE_KEY = "novashop-products";

export async function prepareProductCatalog(page: Page, products: Product[]): Promise<void> {
  await page.addInitScript(
    ({ storageKey, products }) => {
      localStorage.setItem(storageKey, JSON.stringify(products));
    },
    {
      storageKey: PRODUCTS_STORAGE_KEY,
      products,
    },
  );
}
