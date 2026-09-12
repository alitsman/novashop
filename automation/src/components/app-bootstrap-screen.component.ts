import type { Locator, Page } from "@playwright/test";

export class AppBootstrapScreenComponent {
  readonly restoringSessionStatus: Locator;

  constructor(page: Page) {
    this.restoringSessionStatus = page
      .getByRole("status")
      .filter({ hasText: /^Restoring session\.\.\.$/ });
  }
}
