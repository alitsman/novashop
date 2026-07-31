import type { Locator } from "@playwright/test";
import { AddToCartControlComponent } from "./add-to-cart-control.component";

export class ProductCardComponent {
  private readonly root: Locator;
  readonly addToCart: AddToCartControlComponent;

  readonly title: Locator;
  readonly category: Locator;
  readonly description: Locator;
  readonly price: Locator;

  readonly detailsLink: Locator;

  constructor(root: Locator) {
    this.root = root;
    this.addToCart = new AddToCartControlComponent(
      this.root.getByRole("group", {
        name: /^Add to cart controls for /,
      }),
    );

    this.title = this.root.getByRole("heading", { level: 2 });
    this.category = this.root.getByTestId("product-category");
    this.description = this.root.getByTestId("product-description");
    this.price = this.root.getByTestId("product-price");
    this.detailsLink = this.root.getByRole("link", {
      name: /^View details for /,
    });
  }

  async openDetails(): Promise<void> {
    await this.detailsLink.click();
  }
}
