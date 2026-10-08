import { FeatureTag, SuiteTag } from "../../src/config/test-tags";
import { expect, test } from "../../src/fixtures";
import { expectNoAccessibilityViolations } from "../../src/helpers";
import { LoginPage } from "../../src/pages";

test.describe(
  "login accessibility",
  {
    tag: [FeatureTag.Auth, SuiteTag.A11y],
  },
  () => {
    test("default state has no WCAG 2.1 A/AA violations", async ({ page }, testInfo) => {
      const loginPage = new LoginPage(page);

      await loginPage.open();
      await expect(loginPage.signInButton).toBeVisible();

      await expectNoAccessibilityViolations(page, testInfo);
    });

    test("required validation state has no WCAG 2.1 A/AA violations", async ({
      page,
    }, testInfo) => {
      const loginPage = new LoginPage(page);

      await loginPage.open();
      await loginPage.signInButton.click();

      await expect(loginPage.emailError).toBeVisible();
      await expect(loginPage.passwordError).toBeVisible();
      await expect(loginPage.emailInput).toHaveAttribute("aria-invalid", "true");
      await expect(loginPage.passwordInput).toHaveAttribute("aria-invalid", "true");

      await expectNoAccessibilityViolations(page, testInfo);
    });
  },
);
