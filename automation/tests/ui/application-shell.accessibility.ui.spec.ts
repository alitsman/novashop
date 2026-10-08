import { ToastComponent } from "../../src/components";
import { FeatureTag, SuiteTag } from "../../src/config/test-tags";
import { expect, test } from "../../src/fixtures";
import {
  expectNoAccessibilityViolations,
  prepareMockedAuthenticatedSession,
  prepareProductCatalog,
} from "../../src/helpers";
import { NotFoundPage, ProductCatalogPage } from "../../src/pages";
import { ADD_TO_CART_PRODUCT_A, REGULAR_USER, createProduct } from "../../src/test-data";

const UNKNOWN_ROUTE = "/application-shell/accessibility-not-found";

test.describe(
  "application shell accessibility",
  {
    tag: [FeatureTag.Shell, SuiteTag.A11y],
  },
  () => {
    test("not-found page has no WCAG 2.1 A/AA violations", async ({ page }, testInfo) => {
      const notFoundPage = new NotFoundPage(page);

      await page.goto(UNKNOWN_ROUTE);

      await expect(notFoundPage.heading).toBeVisible();
      await expect(notFoundPage.goToProductsLink).toBeVisible();

      await expectNoAccessibilityViolations(page, testInfo);
    });

    test("visible toast has no WCAG 2.1 A/AA violations", async ({ page }, testInfo) => {
      const product = createProduct(ADD_TO_CART_PRODUCT_A);

      await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);
      await prepareProductCatalog(page, [product]);

      const catalogPage = new ProductCatalogPage(page);
      const toast = new ToastComponent(page);

      await catalogPage.open();

      const productCard = catalogPage.getProductCard(product.title);
      await productCard.addToCart.submit();

      await expect(toast.closeButton).toBeVisible();

      await expectNoAccessibilityViolations(page, testInfo);
    });
  },
);
