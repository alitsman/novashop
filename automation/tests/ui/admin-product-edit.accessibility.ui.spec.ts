import { FeatureTag, SuiteTag } from "../../src/config/test-tags";
import { expect, test } from "../../src/fixtures";
import {
  expectNoAccessibilityViolations,
  prepareMockedAuthenticatedSession,
  prepareProductDetails,
} from "../../src/helpers";
import { AdminProductEditPage } from "../../src/pages";
import { ADMIN_LIST_NEWEST_PRODUCT, ADMIN_USER, createProduct } from "../../src/test-data";

const EDIT_PRODUCT = createProduct(ADMIN_LIST_NEWEST_PRODUCT);

test.describe(
  "admin product edit accessibility",
  {
    tag: [FeatureTag.AdminProducts, SuiteTag.A11y],
  },
  () => {
    test("loaded edit page has no WCAG 2.1 A/AA violations", async ({ page }, testInfo) => {
      await prepareMockedAuthenticatedSession(page, ADMIN_USER.user);
      await prepareProductDetails(page, EDIT_PRODUCT);

      const adminProductEditPage = new AdminProductEditPage(page);
      await adminProductEditPage.open(EDIT_PRODUCT.id);

      await expect(adminProductEditPage.form.titleInput).toHaveValue(EDIT_PRODUCT.title);
      await expect(adminProductEditPage.deleteSection).toBeVisible();

      await expectNoAccessibilityViolations(page, testInfo);
    });
  },
);
