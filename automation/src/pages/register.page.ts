import type { Locator, Page } from "@playwright/test";

export class RegisterPage {
  private readonly page: Page;

  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly nameError: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly confirmPasswordError: Locator;
  readonly createAccountButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByRole("heading", {
      name: "Create an account",
      exact: true,
    });
    this.nameInput = page.getByLabel("Name");
    this.emailInput = page.getByLabel("Email address");
    this.passwordInput = page.getByLabel(/^Password/);
    this.confirmPasswordInput = page.getByLabel("Confirm password");
    this.nameError = page.locator("#register-name-error");
    this.emailError = page.locator("#register-email-error");
    this.passwordError = page.locator("#register-password-error");
    this.confirmPasswordError = page.locator("#register-confirm-password-error");
    this.createAccountButton = page.getByRole("button", {
      name: "Create account",
      exact: true,
    });
  }

  async open(): Promise<void> {
    await this.page.goto("/register");
  }
}
