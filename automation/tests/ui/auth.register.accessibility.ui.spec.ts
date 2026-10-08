import { FeatureTag, SuiteTag } from "../../src/config/test-tags";
import { expect, test } from "../../src/fixtures";
import { expectNoAccessibilityViolations } from "../../src/helpers";
import { RegisterPage } from "../../src/pages";

test.describe(
  "registration accessibility",
  {
    tag: [FeatureTag.Auth, SuiteTag.A11y],
  },
  () => {
    test("default state has no WCAG 2.1 A/AA violations", async ({ page }, testInfo) => {
      const registerPage = new RegisterPage(page);

      await registerPage.open();
      await expect(registerPage.createAccountButton).toBeVisible();

      await expectNoAccessibilityViolations(page, testInfo);
    });

    test("required validation state has no WCAG 2.1 A/AA violations", async ({
      page,
    }, testInfo) => {
      const registerPage = new RegisterPage(page);

      await registerPage.open();
      await registerPage.createAccountButton.click();

      await expect(registerPage.nameError).toBeVisible();
      await expect(registerPage.emailError).toBeVisible();
      await expect(registerPage.passwordError).toBeVisible();
      await expect(registerPage.confirmPasswordError).toBeVisible();

      await expect(registerPage.nameInput).toHaveAttribute("aria-invalid", "true");
      await expect(registerPage.emailInput).toHaveAttribute("aria-invalid", "true");
      await expect(registerPage.passwordInput).toHaveAttribute("aria-invalid", "true");
      await expect(registerPage.confirmPasswordInput).toHaveAttribute("aria-invalid", "true");

      await expectNoAccessibilityViolations(page, testInfo);
    });
  },
);
