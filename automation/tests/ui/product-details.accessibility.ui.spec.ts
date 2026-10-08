import { FeatureTag, SuiteTag } from "../../src/config/test-tags";
import { expect, test } from "../../src/fixtures";
import {
  expectNoAccessibilityViolations,
  prepareMockedAuthenticatedSession,
  prepareProductDetails,
  prepareProductDetailsNotFound,
} from "../../src/helpers";
import { ProductDetailsPage } from "../../src/pages";
import { ADD_TO_CART_PRODUCT_A, REGULAR_USER, createProduct } from "../../src/test-data";

const MISSING_PRODUCT_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

test.describe(
  "product details accessibility",
  {
    tag: [FeatureTag.ProductDetails, SuiteTag.A11y],
  },
  () => {
    test("loaded product has no WCAG 2.1 A/AA violations", async ({ page }, testInfo) => {
      const product = createProduct(ADD_TO_CART_PRODUCT_A);

      await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);
      await prepareProductDetails(page, product);

      const productDetailsPage = new ProductDetailsPage(page);
      await productDetailsPage.open(product.id);

      await expect(productDetailsPage.productContent).toBeVisible();
      await expect(productDetailsPage.heading).toHaveText(product.title);

      await expectNoAccessibilityViolations(page, testInfo);
    });

    test("product-not-found state has no WCAG 2.1 A/AA violations", async ({ page }, testInfo) => {
      await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);
      await prepareProductDetailsNotFound(page, MISSING_PRODUCT_ID);

      const productDetailsPage = new ProductDetailsPage(page);
      await productDetailsPage.open(MISSING_PRODUCT_ID);

      await expect(productDetailsPage.notFoundTitle).toBeVisible();

      await expectNoAccessibilityViolations(page, testInfo);
    });
  },
);
