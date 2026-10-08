import { FeatureTag, SuiteTag } from "../../src/config/test-tags";
import { expect, test } from "../../src/fixtures";
import {
  expectNoAccessibilityViolations,
  prepareMockedAuthenticatedSession,
  prepareProductCatalog,
  prepareProductDeleteError,
} from "../../src/helpers";
import { AdminProductsPage } from "../../src/pages";
import {
  ADMIN_LIST_MIDDLE_PRODUCT,
  ADMIN_LIST_NEWEST_PRODUCT,
  ADMIN_LIST_OLDEST_PRODUCT,
  ADMIN_USER,
  createProduct,
} from "../../src/test-data";

const TARGET_PRODUCT = createProduct(ADMIN_LIST_NEWEST_PRODUCT);

const DELETE_FAILURE_RESPONSE = {
  error: {
    code: "INTERNAL_SERVER_ERROR",
    message: "Controlled product deletion failure.",
  },
};

test.describe(
  "admin products accessibility",
  {
    tag: [FeatureTag.AdminProducts, SuiteTag.A11y],
  },
  () => {
    test("populated product list has no WCAG 2.1 A/AA violations", async ({ page }, testInfo) => {
      const products = [
        createProduct(ADMIN_LIST_NEWEST_PRODUCT),
        createProduct(ADMIN_LIST_MIDDLE_PRODUCT),
        createProduct(ADMIN_LIST_OLDEST_PRODUCT),
      ];

      await prepareMockedAuthenticatedSession(page, ADMIN_USER.user);
      await prepareProductCatalog(page, products);

      const adminProductsPage = new AdminProductsPage(page);
      await adminProductsPage.open();

      await expect(adminProductsPage.table).toBeVisible();

      await expectNoAccessibilityViolations(page, testInfo);
    });

    test("delete error state has no WCAG 2.1 A/AA violations", async ({ page }, testInfo) => {
      await prepareMockedAuthenticatedSession(page, ADMIN_USER.user);
      await prepareProductCatalog(page, [TARGET_PRODUCT]);
      await prepareProductDeleteError(page, TARGET_PRODUCT.id, 500, DELETE_FAILURE_RESPONSE);

      const adminProductsPage = new AdminProductsPage(page);
      await adminProductsPage.open();

      await expect(adminProductsPage.getProductRow(TARGET_PRODUCT.title)).toBeVisible();

      await adminProductsPage.getDeleteProductButton(TARGET_PRODUCT.title).click();
      await expect(adminProductsPage.deleteDialog.root).toBeVisible();

      await adminProductsPage.deleteDialog.confirm();

      await expect(adminProductsPage.deleteError).toHaveText(DELETE_FAILURE_RESPONSE.error.message);

      await expectNoAccessibilityViolations(page, testInfo);
    });
  },
);
