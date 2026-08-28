import type { Page } from "@playwright/test";

import type { CartItem } from "../types";

const CART_ITEMS_STORAGE_KEY_PREFIX = "novashop-cart-items";

export async function prepareCart(page: Page, userId: string, items: CartItem[]): Promise<void> {
  const storageKey = `${CART_ITEMS_STORAGE_KEY_PREFIX}-${userId}`;

  await page.addInitScript(
    ({ storageKey, items }) => {
      if (localStorage.getItem(storageKey) !== null) {
        return;
      }

      localStorage.setItem(storageKey, JSON.stringify(items));
    },
    { storageKey, items },
  );
}
