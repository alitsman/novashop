import { expect, test } from "../../src/fixtures";
import { trackAndAbortRequest } from "../../src/helpers";
import { LoginPage } from "../../src/pages";

test.describe("login client validation", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.open();
  });

  test("empty form: shows required errors, focuses email, and does not submit", async ({
    page,
  }) => {
    const wasLoginRequestSent = await trackAndAbortRequest(page, "**/auth/login");

    await loginPage.signInButton.click();

    await expect(loginPage.emailInput).toHaveAttribute("aria-invalid", "true");
    await expect(loginPage.passwordInput).toHaveAttribute("aria-invalid", "true");

    await expect(loginPage.emailError).toBeVisible();
    await expect(loginPage.passwordError).toBeVisible();

    await expect(loginPage.emailInput).toHaveAccessibleDescription("Email address is required.");
    await expect(loginPage.passwordInput).toHaveAccessibleDescription("Password is required.");

    await expect(loginPage.emailInput).toBeFocused();

    expect(wasLoginRequestSent()).toBe(false);
  });

  test("whitespace-only email: shows the required error, focuses email, and does not submit", async ({
    page,
  }) => {
    const wasLoginRequestSent = await trackAndAbortRequest(page, "**/auth/login");

    await loginPage.emailInput.fill("   ");
    await loginPage.passwordInput.fill("ValidPassword1!");

    await loginPage.signInButton.click();

    await expect(loginPage.emailInput).toHaveAttribute("aria-invalid", "true");
    await expect(loginPage.passwordInput).toHaveAttribute("aria-invalid", "false");

    await expect(loginPage.emailError).toBeVisible();
    await expect(loginPage.passwordError).toBeHidden();

    await expect(loginPage.emailInput).toHaveAccessibleDescription("Email address is required.");
    await expect(loginPage.passwordInput).toHaveAccessibleDescription("");

    await expect(loginPage.emailInput).toBeFocused();

    expect(wasLoginRequestSent()).toBe(false);
  });

  test("correcting fields: clears only the corresponding validation error", async ({ page }) => {
    const wasLoginRequestSent = await trackAndAbortRequest(page, "**/auth/login");

    await test.step("Show required errors", async () => {
      await loginPage.signInButton.click();

      await expect(loginPage.emailError).toBeVisible();
      await expect(loginPage.passwordError).toBeVisible();
    });

    await test.step("Correct the email", async () => {
      await expect(loginPage.emailInput).toHaveAttribute("aria-invalid", "true");
      await expect(loginPage.emailInput).toHaveAccessibleDescription("Email address is required.");

      await loginPage.emailInput.fill("user@example.com");

      await expect(loginPage.emailInput).toHaveAttribute("aria-invalid", "false");
      await expect(loginPage.emailError).toBeHidden();
      await expect(loginPage.emailInput).toHaveAccessibleDescription("");
    });

    await test.step("Correct the password", async () => {
      await expect(loginPage.passwordInput).toHaveAttribute("aria-invalid", "true");
      await expect(loginPage.passwordError).toBeVisible();
      await expect(loginPage.passwordInput).toHaveAccessibleDescription("Password is required.");

      await loginPage.passwordInput.fill("ValidPassword1!");

      await expect(loginPage.passwordInput).toHaveAttribute("aria-invalid", "false");
      await expect(loginPage.passwordError).toBeHidden();
      await expect(loginPage.passwordInput).toHaveAccessibleDescription("");
    });

    expect(wasLoginRequestSent()).toBe(false);
  });
});
