import type { Locator, Page } from "@playwright/test";

export class ToastComponent {
  private readonly page: Page;
  readonly message: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.message = this.page.getByTestId("toast-message");
    this.closeButton = this.page.getByRole("button", {
      name: "Close notification",
      exact: true,
    });
  }

  async close(): Promise<void> {
    await this.closeButton.click();
  }
}
