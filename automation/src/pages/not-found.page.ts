import type { Locator, Page } from "@playwright/test";
import { HeaderComponent, LayoutComponent } from "../components";

export class NotFoundPage {
  readonly header: HeaderComponent;
  readonly layout: LayoutComponent;
  readonly heading: Locator;
  readonly goToProductsLink: Locator;

  constructor(page: Page) {
    this.header = new HeaderComponent(page);
    this.layout = new LayoutComponent(page);

    this.heading = this.layout.mainContent.getByRole("heading", {
      name: "Page not found.",
      level: 1,
      exact: true,
    });

    this.goToProductsLink = this.layout.mainContent.getByRole("link", {
      name: "Go to products",
      exact: true,
    });
  }
}
