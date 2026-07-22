import type { Locator, Page } from "@playwright/test";

export class LoginPage {
  private readonly page: Page;

  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByRole("heading", {
      name: "Sign in",
      exact: true,
    });
    this.emailInput = page.getByLabel("Email address");
    this.passwordInput = page.getByLabel("Password");
    this.signInButton = page.getByRole("button", {
      name: "Sign in",
      exact: true,
    });
    this.errorMessage = page.getByRole("alert");
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
