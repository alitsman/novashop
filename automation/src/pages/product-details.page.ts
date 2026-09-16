import type { Locator, Page } from "@playwright/test";

import { AddToCartControlComponent, HeaderComponent } from "../components";

export class ProductDetailsPage {
  private readonly page: Page;

  readonly root: Locator;
  readonly header: HeaderComponent;

  readonly heading: Locator;
  readonly loadingStatus: Locator;

  readonly productContent: Locator;
  readonly image: Locator;
  readonly category: Locator;
  readonly description: Locator;
  readonly price: Locator;
  readonly purchaseOptionsHeading: Locator;

  readonly notFoundTitle: Locator;
  readonly errorAlert: Locator;
  readonly backLink: Locator;

  readonly addToCart: AddToCartControlComponent;

  constructor(page: Page) {
    this.page = page;

    this.root = this.page.getByRole("main").getByRole("region");
    this.header = new HeaderComponent(this.page);

    this.heading = this.root.getByRole("heading", {
      level: 1,
    });

    this.loadingStatus = this.root.getByRole("status").filter({
      hasText: /^Loading product\.\.\.$/,
    });

    this.productContent = this.root.getByRole("article");

    // The product image is decorative (alt=""), so it has no accessible role
    // and can only be located structurally.
    this.image = this.productContent.locator("img");

    this.category = this.productContent.getByTestId("product-category");
    this.description = this.productContent.getByTestId("product-description");
    this.price = this.productContent.getByTestId("product-price");

    this.purchaseOptionsHeading = this.productContent.getByRole("heading", {
      name: "Purchase options",
      level: 2,
      exact: true,
    });

    this.notFoundTitle = this.root.getByRole("heading", {
      name: "Product not found.",
      level: 2,
      exact: true,
    });

    const errorTitle = this.page.getByRole("heading", {
      name: "Failed to load product.",
      level: 2,
      exact: true,
    });

    this.errorAlert = this.root.getByRole("alert").filter({
      has: errorTitle,
    });

    this.backLink = this.root.getByRole("link", {
      name: "Back to products",
      exact: true,
    });

    const addToCartRoot = this.productContent.getByRole("group", {
      name: /^Add to cart controls for /,
    });

    this.addToCart = new AddToCartControlComponent(addToCartRoot);
  }

  async open(productId: string): Promise<void> {
    await this.page.goto(`/products/${productId}`);
  }
}
