import { FeatureTag, SuiteTag } from "../../src/config/test-tags";
import { expect, test } from "../../src/fixtures";
import {
  expectNoAccessibilityViolations,
  prepareCart,
  prepareCreateOrderNetworkFailure,
  prepareMockedAuthenticatedSession,
  prepareProductCatalog,
} from "../../src/helpers";
import { CheckoutPage } from "../../src/pages";
import { CART_PRODUCT_A, REGULAR_USER, createCartItem } from "../../src/test-data";

const VALID_FULL_NAME = "Test Customer";
const VALID_PHONE = "+995 555 010101";
const VALID_ADDRESS = "12 Test Street";

test.describe(
  "checkout accessibility",
  {
    tag: [FeatureTag.Checkout, SuiteTag.A11y],
  },
  () => {
    test("default state has no WCAG 2.1 A/AA violations", async ({ page }, testInfo) => {
      await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);
      await prepareProductCatalog(page, [CART_PRODUCT_A]);
      await prepareCart(page, REGULAR_USER.user.id, [createCartItem(CART_PRODUCT_A)]);

      const checkoutPage = new CheckoutPage(page);
      await checkoutPage.open();

      await expect(checkoutPage.form).toBeVisible();
      await expect(checkoutPage.orderSummaryBlock).toBeVisible();
      await expect(checkoutPage.submitButton).toBeEnabled();

      await expectNoAccessibilityViolations(page, testInfo);
    });

    test("required validation state has no WCAG 2.1 A/AA violations", async ({
      page,
    }, testInfo) => {
      await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);
      await prepareProductCatalog(page, [CART_PRODUCT_A]);
      await prepareCart(page, REGULAR_USER.user.id, [createCartItem(CART_PRODUCT_A)]);

      const checkoutPage = new CheckoutPage(page);
      await checkoutPage.open();

      await checkoutPage.submitButton.click();

      await expect(checkoutPage.formError).toHaveText(
        "Please fix the highlighted fields before placing your order.",
      );
      await expect(checkoutPage.fullNameInput).toHaveAttribute("aria-invalid", "true");
      await expect(checkoutPage.phoneInput).toHaveAttribute("aria-invalid", "true");
      await expect(checkoutPage.addressInput).toHaveAttribute("aria-invalid", "true");

      await expectNoAccessibilityViolations(page, testInfo);
    });

    test("order error state has no WCAG 2.1 A/AA violations", async ({ page }, testInfo) => {
      await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);
      await prepareProductCatalog(page, [CART_PRODUCT_A]);
      await prepareCreateOrderNetworkFailure(page);
      await prepareCart(page, REGULAR_USER.user.id, [createCartItem(CART_PRODUCT_A)]);

      const checkoutPage = new CheckoutPage(page);
      await checkoutPage.open();

      await checkoutPage.fullNameInput.fill(VALID_FULL_NAME);
      await checkoutPage.phoneInput.fill(VALID_PHONE);
      await checkoutPage.addressInput.fill(VALID_ADDRESS);

      await checkoutPage.submitButton.click();

      await expect(checkoutPage.formError).toHaveText("Unable to connect to the server.");

      await expectNoAccessibilityViolations(page, testInfo);
    });
  },
);
