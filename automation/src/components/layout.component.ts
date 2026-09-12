import type { Locator, Page } from "@playwright/test";

export class LayoutComponent {
  readonly skipLink: Locator;
  readonly mainContent: Locator;

  constructor(page: Page) {
    this.skipLink = page.getByRole("link", {
      name: "Skip to main content",
      exact: true,
    });

    this.mainContent = page.getByRole("main");
  }
}
