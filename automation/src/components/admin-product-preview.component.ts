import type { Locator } from "@playwright/test";

export class AdminProductPreviewComponent {
  private readonly root: Locator;
  private readonly card: Locator;

  readonly image: Locator;
  readonly imagePlaceholder: Locator;
  readonly actions: Locator;

  readonly category: Locator;
  readonly productTitle: Locator;
  readonly description: Locator;
  readonly price: Locator;
  readonly stock: Locator;

  constructor(root: Locator) {
    this.root = root;

    this.card = this.root.getByRole("article", {
      name: "Product card preview",
      exact: true,
    });

    // The image has a dynamic accessible name, so locate the image element
    // within the already scoped preview card.
    this.image = this.card.locator("img");

    // The image placeholder has no semantic role or stable attribute.
    this.imagePlaceholder = this.card.locator(".admin-product-preview__image-placeholder");

    this.actions = this.card.locator(".admin-product-preview__actions");

    // These preview values have no individual accessible names, so scope
    // their structural locators to the preview card.
    this.category = this.card.locator(".admin-product-preview__category");

    this.productTitle = this.card.getByRole("heading", {
      level: 3,
    });

    this.description = this.card.locator(".admin-product-preview__description");
    this.price = this.card.locator(".admin-product-preview__price");
    this.stock = this.card.locator(".admin-product-preview__stock");
  }
}
