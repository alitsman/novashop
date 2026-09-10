import { expect, test } from "../../src/fixtures";
import { trackAndAbortRequest } from "../../src/helpers";
import { RegisterPage } from "../../src/pages";

const PASSWORD_HINT =
  "Use at least 8 characters, including an uppercase letter, a number, and a special character.";
const VALID_NAME = "Validation User";
const VALID_EMAIL = "validation.user@example.com";
const VALID_PASSWORD = "ValidPassword1!";

const weakPasswordCases = [
  {
    name: "fewer than 8 characters",
    password: "Ab1!xyz",
    error: "Password must contain at least 8 characters.",
  },
  {
    name: "without an uppercase letter",
    password: "newuser123!",
    error: "Password must contain at least one uppercase letter.",
  },
  {
    name: "without a number",
    password: "NewUserPass!",
    error: "Password must contain at least one number.",
  },
  {
    name: "without a special character",
    password: "NewUser123",
    error: "Password must contain at least one special character.",
  },
];

test.describe("registration client validation", () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.open();
  });

  test("empty form: shows required errors, focuses name, and does not submit", async ({ page }) => {
    const wasRegisterRequestSent = await trackAndAbortRequest(page, "**/auth/register");

    await registerPage.createAccountButton.click();

    await expect(registerPage.nameInput).toHaveAttribute("aria-invalid", "true");
    await expect(registerPage.emailInput).toHaveAttribute("aria-invalid", "true");
    await expect(registerPage.passwordInput).toHaveAttribute("aria-invalid", "true");
    await expect(registerPage.confirmPasswordInput).toHaveAttribute("aria-invalid", "true");

    await expect(registerPage.nameError).toBeVisible();
    await expect(registerPage.emailError).toBeVisible();
    await expect(registerPage.passwordError).toBeVisible();
    await expect(registerPage.confirmPasswordError).toBeVisible();

    await expect(registerPage.nameInput).toHaveAccessibleDescription("Name is required.");
    await expect(registerPage.emailInput).toHaveAccessibleDescription("Email address is required.");
    await expect(registerPage.passwordInput).toHaveAccessibleDescription(
      `${PASSWORD_HINT} Password is required.`,
    );
    await expect(registerPage.confirmPasswordInput).toHaveAccessibleDescription(
      "Confirm your password.",
    );

    await expect(registerPage.nameInput).toBeFocused();

    expect(wasRegisterRequestSent()).toBe(false);
  });

  test("whitespace-only name and email: shows required errors, focuses name, and does not submit", async ({
    page,
  }) => {
    const wasRegisterRequestSent = await trackAndAbortRequest(page, "**/auth/register");

    await registerPage.nameInput.fill("   ");
    await registerPage.emailInput.fill("   ");
    await registerPage.passwordInput.fill(VALID_PASSWORD);
    await registerPage.confirmPasswordInput.fill(VALID_PASSWORD);

    await registerPage.createAccountButton.click();

    await expect(registerPage.nameInput).toHaveAttribute("aria-invalid", "true");
    await expect(registerPage.emailInput).toHaveAttribute("aria-invalid", "true");
    await expect(registerPage.passwordInput).toHaveAttribute("aria-invalid", "false");
    await expect(registerPage.confirmPasswordInput).toHaveAttribute("aria-invalid", "false");

    await expect(registerPage.nameError).toBeVisible();
    await expect(registerPage.emailError).toBeVisible();
    await expect(registerPage.passwordError).toBeHidden();
    await expect(registerPage.confirmPasswordError).toBeHidden();

    await expect(registerPage.nameInput).toHaveAccessibleDescription("Name is required.");
    await expect(registerPage.emailInput).toHaveAccessibleDescription("Email address is required.");

    await expect(registerPage.nameInput).toBeFocused();

    expect(wasRegisterRequestSent()).toBe(false);
  });

  test("invalid email: shows the email error, focuses email, and does not submit", async ({
    page,
  }) => {
    const wasRegisterRequestSent = await trackAndAbortRequest(page, "**/auth/register");

    await registerPage.nameInput.fill(VALID_NAME);
    await registerPage.emailInput.fill("not-an-email");
    await registerPage.passwordInput.fill(VALID_PASSWORD);
    await registerPage.confirmPasswordInput.fill(VALID_PASSWORD);

    await registerPage.createAccountButton.click();

    await expect(registerPage.nameInput).toHaveAttribute("aria-invalid", "false");
    await expect(registerPage.emailInput).toHaveAttribute("aria-invalid", "true");
    await expect(registerPage.passwordInput).toHaveAttribute("aria-invalid", "false");
    await expect(registerPage.confirmPasswordInput).toHaveAttribute("aria-invalid", "false");

    await expect(registerPage.nameError).toBeHidden();
    await expect(registerPage.emailError).toBeVisible();
    await expect(registerPage.passwordError).toBeHidden();
    await expect(registerPage.confirmPasswordError).toBeHidden();

    await expect(registerPage.emailInput).toHaveAccessibleDescription(
      "Enter an email address with @ and a domain.",
    );

    await expect(registerPage.emailInput).toBeFocused();

    expect(wasRegisterRequestSent()).toBe(false);
  });

  for (const weakPasswordCase of weakPasswordCases) {
    test(`weak password ${weakPasswordCase.name}: shows the password error, focuses password, and does not submit`, async ({
      page,
    }) => {
      const wasRegisterRequestSent = await trackAndAbortRequest(page, "**/auth/register");

      await registerPage.nameInput.fill(VALID_NAME);
      await registerPage.emailInput.fill(VALID_EMAIL);
      await registerPage.passwordInput.fill(weakPasswordCase.password);
      await registerPage.confirmPasswordInput.fill(weakPasswordCase.password);

      await registerPage.createAccountButton.click();

      await expect(registerPage.nameInput).toHaveAttribute("aria-invalid", "false");
      await expect(registerPage.emailInput).toHaveAttribute("aria-invalid", "false");
      await expect(registerPage.passwordInput).toHaveAttribute("aria-invalid", "true");
      await expect(registerPage.confirmPasswordInput).toHaveAttribute("aria-invalid", "false");

      await expect(registerPage.nameError).toBeHidden();
      await expect(registerPage.emailError).toBeHidden();
      await expect(registerPage.passwordError).toBeVisible();
      await expect(registerPage.confirmPasswordError).toBeHidden();

      await expect(registerPage.passwordInput).toHaveAccessibleDescription(
        `${PASSWORD_HINT} ${weakPasswordCase.error}`,
      );

      await expect(registerPage.passwordInput).toBeFocused();

      expect(wasRegisterRequestSent()).toBe(false);
    });
  }

  test("empty password confirmation: shows the confirmation error, focuses confirmation, and does not submit", async ({
    page,
  }) => {
    const wasRegisterRequestSent = await trackAndAbortRequest(page, "**/auth/register");

    await registerPage.nameInput.fill(VALID_NAME);
    await registerPage.emailInput.fill(VALID_EMAIL);
    await registerPage.passwordInput.fill(VALID_PASSWORD);

    await registerPage.createAccountButton.click();

    await expect(registerPage.nameInput).toHaveAttribute("aria-invalid", "false");
    await expect(registerPage.emailInput).toHaveAttribute("aria-invalid", "false");
    await expect(registerPage.passwordInput).toHaveAttribute("aria-invalid", "false");
    await expect(registerPage.confirmPasswordInput).toHaveAttribute("aria-invalid", "true");

    await expect(registerPage.nameError).toBeHidden();
    await expect(registerPage.emailError).toBeHidden();
    await expect(registerPage.passwordError).toBeHidden();
    await expect(registerPage.confirmPasswordError).toBeVisible();

    await expect(registerPage.confirmPasswordInput).toHaveAccessibleDescription(
      "Confirm your password.",
    );

    await expect(registerPage.confirmPasswordInput).toBeFocused();

    expect(wasRegisterRequestSent()).toBe(false);
  });

  test("password mismatch: shows the confirmation error, focuses confirmation, and does not submit", async ({
    page,
  }) => {
    const wasRegisterRequestSent = await trackAndAbortRequest(page, "**/auth/register");

    await registerPage.nameInput.fill(VALID_NAME);
    await registerPage.emailInput.fill(VALID_EMAIL);
    await registerPage.passwordInput.fill(VALID_PASSWORD);
    await registerPage.confirmPasswordInput.fill("DifferentPassword1!");

    await registerPage.createAccountButton.click();

    await expect(registerPage.nameInput).toHaveAttribute("aria-invalid", "false");
    await expect(registerPage.emailInput).toHaveAttribute("aria-invalid", "false");
    await expect(registerPage.passwordInput).toHaveAttribute("aria-invalid", "false");
    await expect(registerPage.confirmPasswordInput).toHaveAttribute("aria-invalid", "true");

    await expect(registerPage.nameError).toBeHidden();
    await expect(registerPage.emailError).toBeHidden();
    await expect(registerPage.passwordError).toBeHidden();
    await expect(registerPage.confirmPasswordError).toBeVisible();

    await expect(registerPage.confirmPasswordInput).toHaveAccessibleDescription(
      "Passwords do not match.",
    );

    await expect(registerPage.confirmPasswordInput).toBeFocused();

    expect(wasRegisterRequestSent()).toBe(false);
  });

  test("correcting fields: clears field errors and the dependent confirmation error", async ({
    page,
  }) => {
    const wasRegisterRequestSent = await trackAndAbortRequest(page, "**/auth/register");

    await test.step("Show required errors", async () => {
      await registerPage.createAccountButton.click();

      await expect(registerPage.nameError).toBeVisible();
      await expect(registerPage.emailError).toBeVisible();
      await expect(registerPage.passwordError).toBeVisible();
      await expect(registerPage.confirmPasswordError).toBeVisible();
    });

    await test.step("Correct the name", async () => {
      await expect(registerPage.nameInput).toHaveAttribute("aria-invalid", "true");
      await expect(registerPage.nameInput).toHaveAccessibleDescription("Name is required.");

      await registerPage.nameInput.fill(VALID_NAME);

      await expect(registerPage.nameInput).toHaveAttribute("aria-invalid", "false");
      await expect(registerPage.nameError).toBeHidden();
      await expect(registerPage.nameInput).toHaveAccessibleDescription("");
    });

    await test.step("Correct the email", async () => {
      await expect(registerPage.emailInput).toHaveAttribute("aria-invalid", "true");
      await expect(registerPage.emailError).toBeVisible();
      await expect(registerPage.emailInput).toHaveAccessibleDescription(
        "Email address is required.",
      );

      await registerPage.emailInput.fill(VALID_EMAIL);

      await expect(registerPage.emailInput).toHaveAttribute("aria-invalid", "false");
      await expect(registerPage.emailError).toBeHidden();
      await expect(registerPage.emailInput).toHaveAccessibleDescription("");
    });

    await test.step("Correct the password", async () => {
      await expect(registerPage.passwordInput).toHaveAttribute("aria-invalid", "true");
      await expect(registerPage.passwordError).toBeVisible();
      await expect(registerPage.passwordInput).toHaveAccessibleDescription(
        `${PASSWORD_HINT} Password is required.`,
      );

      await expect(registerPage.confirmPasswordInput).toHaveAttribute("aria-invalid", "true");
      await expect(registerPage.confirmPasswordError).toBeVisible();
      await expect(registerPage.confirmPasswordInput).toHaveAccessibleDescription(
        "Confirm your password.",
      );

      await registerPage.passwordInput.fill(VALID_PASSWORD);

      await expect(registerPage.passwordInput).toHaveAttribute("aria-invalid", "false");
      await expect(registerPage.passwordError).toBeHidden();
      await expect(registerPage.passwordInput).toHaveAccessibleDescription(PASSWORD_HINT);

      await expect(registerPage.confirmPasswordInput).toHaveAttribute("aria-invalid", "false");
      await expect(registerPage.confirmPasswordError).toBeHidden();
      await expect(registerPage.confirmPasswordInput).toHaveAccessibleDescription("");
    });

    await test.step("Show and correct the password mismatch", async () => {
      await registerPage.confirmPasswordInput.fill("DifferentPassword1!");
      await registerPage.createAccountButton.click();

      await expect(registerPage.confirmPasswordInput).toHaveAttribute("aria-invalid", "true");
      await expect(registerPage.confirmPasswordError).toBeVisible();
      await expect(registerPage.confirmPasswordInput).toHaveAccessibleDescription(
        "Passwords do not match.",
      );

      await registerPage.confirmPasswordInput.fill(VALID_PASSWORD);

      await expect(registerPage.confirmPasswordInput).toHaveAttribute("aria-invalid", "false");
      await expect(registerPage.confirmPasswordError).toBeHidden();
      await expect(registerPage.confirmPasswordInput).toHaveAccessibleDescription("");
    });

    expect(wasRegisterRequestSent()).toBe(false);
  });
});
