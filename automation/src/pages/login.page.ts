import type { Locator, Page } from "@playwright/test";

export class LoginPage {
  private readonly page: Page;

  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly signInButton: Locator;
  readonly signingInButton: Locator;
  readonly statusMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByRole("heading", {
      name: "Sign in",
      exact: true,
    });
    this.emailInput = page.getByLabel("Email address");
    this.passwordInput = page.getByLabel("Password");
    this.emailError = page.locator("#login-email-error");
    this.passwordError = page.locator("#login-password-error");
    this.signInButton = page.getByRole("button", {
      name: "Sign in",
      exact: true,
    });
    this.signingInButton = page.getByRole("button", {
      name: "Signing in...",
      exact: true,
    });
    this.statusMessage = page
      .getByRole("form", {
        name: "Sign in",
        exact: true,
      })
      .getByRole("status");
    this.errorMessage = page.locator(".auth-page-layout__form-footer").getByRole("alert");
  }

  async open(): Promise<void> {
    await this.page.goto("/login");
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}
