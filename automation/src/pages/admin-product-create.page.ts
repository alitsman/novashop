import type { Locator, Page } from "@playwright/test";

import { AdminProductFormComponent, AdminProductPreviewComponent } from "../components";

export class AdminProductCreatePage {
  private readonly page: Page;

  readonly root: Locator;

  readonly heading: Locator;
  readonly description: Locator;

  readonly form: AdminProductFormComponent;
  readonly preview: AdminProductPreviewComponent;

  constructor(page: Page) {
    this.page = page;

    this.root = this.page.getByRole("region", {
      name: "Create product",
      exact: true,
    });

    this.heading = this.root.getByRole("heading", {
      name: "Create product",
      level: 1,
      exact: true,
    });

    this.description = this.root.getByText(
      "Add a new product to the catalog. The preview updates while you fill in the form.",
      {
        exact: true,
      },
    );

    const formRoot = this.root.getByRole("form", {
      name: "Create product form",
      exact: true,
    });

    this.form = new AdminProductFormComponent(formRoot);

    const previewRoot = this.root.getByRole("region", {
      name: "Product card preview",
      exact: true,
    });

    this.preview = new AdminProductPreviewComponent(previewRoot);
  }

  async open(): Promise<void> {
    await this.page.goto("/admin/products/new");
  }
}
