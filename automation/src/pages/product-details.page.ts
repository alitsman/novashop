import type { Locator, Page } from "@playwright/test";
import { AddToCartControlComponent } from "../components/add-to-cart-control.component";

export class ProductDetailsPage {
  private readonly page: Page;
  readonly heading: Locator;
  readonly category: Locator;
  readonly description: Locator;
  readonly price: Locator;
  readonly backLink: Locator;

  readonly addToCart: AddToCartControlComponent;

  constructor(page: Page) {
    this.page = page;

    this.heading = this.page.getByRole("heading", {
      level: 1,
    });

    this.category = this.page.getByTestId("product-category");
    this.description = this.page.getByTestId("product-description");
    this.price = this.page.getByTestId("product-price");
    this.backLink = this.page.getByRole("link", {
      name: "Back to products",
      exact: true,
    });

    const addToCartRoot = this.page.getByRole("group", {
      name: /^Add to cart controls for /,
    });

    this.addToCart = new AddToCartControlComponent(addToCartRoot);
  }
}
