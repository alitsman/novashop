import { FeatureTag, SuiteTag } from "../../src/config/test-tags";
import { expect, test } from "../../src/fixtures";
import {
  expectNoAccessibilityViolations,
  prepareCart,
  prepareMockedAuthenticatedSession,
  prepareProductCatalog,
} from "../../src/helpers";
import { CartPage } from "../../src/pages";
import { CART_PRODUCT_A, REGULAR_USER, createCartItem } from "../../src/test-data";

test.describe(
  "cart accessibility",
  {
    tag: [FeatureTag.Cart, SuiteTag.A11y],
  },
  () => {
    test("populated cart has no WCAG 2.1 A/AA violations", async ({ page }, testInfo) => {
      const seedCartItem = createCartItem(CART_PRODUCT_A);

      await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);
      await prepareProductCatalog(page, [CART_PRODUCT_A]);
      await prepareCart(page, REGULAR_USER.user.id, [seedCartItem]);

      const cartPage = new CartPage(page);
      await cartPage.open();

      await expect(cartPage.cartItemsList).toBeVisible();
      await expect(cartPage.orderSummaryBlock).toBeVisible();

      await expectNoAccessibilityViolations(page, testInfo);
    });

    test("invalid quantity state has no WCAG 2.1 A/AA violations", async ({ page }, testInfo) => {
      const seedCartItem = createCartItem(CART_PRODUCT_A);

      await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);
      await prepareProductCatalog(page, [CART_PRODUCT_A]);
      await prepareCart(page, REGULAR_USER.user.id, [seedCartItem]);

      const cartPage = new CartPage(page);
      await cartPage.open();

      const cartItem = cartPage.getCartItem(seedCartItem.title);

      await cartItem.fillQuantity("0");

      await expect(cartItem.quantityError).toHaveText("Quantity must be at least 1.");
      await expect(cartItem.quantityInput).toHaveAttribute("aria-invalid", "true");

      await expectNoAccessibilityViolations(page, testInfo);
    });

    test("removal confirmation dialog has no WCAG 2.1 A/AA violations", async ({
      page,
    }, testInfo) => {
      const seedCartItem = createCartItem(CART_PRODUCT_A);

      await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);
      await prepareProductCatalog(page, [CART_PRODUCT_A]);
      await prepareCart(page, REGULAR_USER.user.id, [seedCartItem]);

      const cartPage = new CartPage(page);
      await cartPage.open();

      const cartItem = cartPage.getCartItem(seedCartItem.title);

      await cartItem.removeButton.click();
      await expect(cartPage.removeItemDialog.root).toBeVisible();

      await expectNoAccessibilityViolations(page, testInfo);
    });
  },
);
