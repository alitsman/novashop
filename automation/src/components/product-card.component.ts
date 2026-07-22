import type { Locator } from "@playwright/test";

export class ProductCardComponent {
  private readonly root: Locator;

  readonly title: Locator;

  constructor(root: Locator) {
    this.root = root;
    this.title = this.root.getByRole("heading", { level: 2 });
  }
}
