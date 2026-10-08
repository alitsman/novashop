import { FeatureTag, SuiteTag } from "../../src/config/test-tags";
import { expect, test } from "../../src/fixtures";
import {
  expectNoAccessibilityViolations,
  prepareMockedAuthenticatedSession,
} from "../../src/helpers";
import { AdminProductCreatePage } from "../../src/pages";
import { ADMIN_USER } from "../../src/test-data";

test.describe(
  "admin product create accessibility",
  {
    tag: [FeatureTag.AdminProducts, SuiteTag.A11y],
  },
  () => {
    test("default create form has no WCAG 2.1 A/AA violations", async ({ page }, testInfo) => {
      await prepareMockedAuthenticatedSession(page, ADMIN_USER.user);

      const adminProductCreatePage = new AdminProductCreatePage(page);
      await adminProductCreatePage.open();

      await expect(adminProductCreatePage.form.titleInput).toBeVisible();
      await expect(adminProductCreatePage.form.submitButton).toBeEnabled();

      await expectNoAccessibilityViolations(page, testInfo);
    });

    test("required validation state has no WCAG 2.1 A/AA violations", async ({
      page,
    }, testInfo) => {
      await prepareMockedAuthenticatedSession(page, ADMIN_USER.user);

      const adminProductCreatePage = new AdminProductCreatePage(page);
      await adminProductCreatePage.open();

      await adminProductCreatePage.form.submitButton.click();

      await expect(adminProductCreatePage.form.titleInput).toHaveAttribute("aria-invalid", "true");

      await expectNoAccessibilityViolations(page, testInfo);
    });
  },
);
