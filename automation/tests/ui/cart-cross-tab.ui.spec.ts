import type { Page } from "@playwright/test";

import { FeatureTag } from "../../src/config/test-tags";
import { expect, test } from "../../src/fixtures";
import { prepareMockedAuthenticatedSession, prepareProductCatalog } from "../../src/helpers";
import { CartPage, ProductCatalogPage } from "../../src/pages";
import { CART_PRODUCT_A, CART_PRODUCT_B, CART_PRODUCTS, REGULAR_USER } from "../../src/test-data";

// Each tab needs its own API mocks.
// Both tabs share the same browser context and localStorage.
async function openCatalogTab(page: Page): Promise<ProductCatalogPage> {
  await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);
  await prepareProductCatalog(page, CART_PRODUCTS);

  const catalogPage = new ProductCatalogPage(page);

  await catalogPage.open();

  return catalogPage;
}

test.describe("cart in two tabs of the same browser", { tag: FeatureTag.Cart }, () => {
  test("shows a product added in another tab without a reload", async ({ context, page }) => {
    const firstTab = await openCatalogTab(page);

    await firstTab.getProductCard(CART_PRODUCT_A.title).addToCart.submit();
    await expect(firstTab.header.cartLink).toHaveAccessibleName("Cart, 1 item");

    const secondTab = await openCatalogTab(await context.newPage());

    await expect(secondTab.header.cartLink).toHaveAccessibleName("Cart, 1 item");

    await secondTab.getProductCard(CART_PRODUCT_B.title).addToCart.submit();
    await expect(secondTab.header.cartLink).toHaveAccessibleName("Cart, 2 items");

    // The first tab must update without a reload.
    await expect(firstTab.header.cartLink).toHaveAccessibleName("Cart, 2 items");
  });

  test("keeps a product added in another tab after the first tab opens its cart", async ({
    context,
    page,
  }) => {
    const firstTab = await openCatalogTab(page);

    await firstTab.getProductCard(CART_PRODUCT_A.title).addToCart.submit();
    await expect(firstTab.header.cartLink).toHaveAccessibleName("Cart, 1 item");

    const secondTabPage = await context.newPage();
    const secondTab = await openCatalogTab(secondTabPage);

    await secondTab.getProductCard(CART_PRODUCT_B.title).addToCart.submit();
    await expect(secondTab.header.cartLink).toHaveAccessibleName("Cart, 2 items");

    const firstTabCart = new CartPage(page);

    // SPA navigation triggers cart sync without reloading the first tab.
    // The old cart state must not overwrite the newer saved cart.
    await firstTab.header.openCart();

    await expect(page).toHaveURL("/cart");
    await expect(firstTabCart.syncStatus).toBeHidden();

    const secondTabCart = new CartPage(secondTabPage);

    // Reload the second tab to read the cart saved in localStorage.
    await secondTabPage.reload();
    await secondTab.header.openCart();

    await expect(secondTabCart.header.cartLink).toHaveAccessibleName("Cart, 2 items");
    await expect(secondTabCart.cartItemTitles).toHaveText([
      CART_PRODUCT_A.title,
      CART_PRODUCT_B.title,
    ]);
  });
});
