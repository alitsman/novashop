import type { Locator, Page } from "@playwright/test";

import { HeaderComponent } from "../components";

export class AdminProductsPage {
  private readonly page: Page;
  private readonly emptyState: Locator;

  readonly root: Locator;
  readonly header: HeaderComponent;

  readonly heading: Locator;
  readonly loadingStatus: Locator;
  readonly errorAlert: Locator;
  readonly retryButton: Locator;

  readonly createProductLink: Locator;
  readonly emptyStateTitle: Locator;
  readonly emptyStateDescription: Locator;
  readonly emptyStateCreateProductLink: Locator;

  readonly table: Locator;
  readonly columnHeaders: Locator;
  readonly editLinks: Locator;

  constructor(page: Page) {
    this.page = page;

    this.root = this.page.getByRole("region", {
      name: "Admin products",
      exact: true,
    });

    this.header = new HeaderComponent(this.page);

    this.heading = this.root.getByRole("heading", {
      name: "Admin products",
      level: 1,
      exact: true,
    });

    // The Loader has no accessible name, so identify it by its visible message.
    this.loadingStatus = this.root.getByRole("status").filter({
      hasText: /^Loading admin products\.\.\.$/,
    });

    const errorTitle = this.page.getByRole("heading", {
      name: "Failed to load admin products.",
      level: 2,
      exact: true,
    });

    this.errorAlert = this.root.getByRole("alert").filter({
      has: errorTitle,
    });

    this.retryButton = this.errorAlert.getByRole("button", {
      name: "Try again",
      exact: true,
    });

    // The empty state has another "Create product" link, so scope this persistent action to the page header.
    this.createProductLink = this.root.locator(".admin-products-page__header").getByRole("link", {
      name: "Create product",
      exact: true,
    });

    // EmptyState has no semantic container, so scope its duplicated action by component root.
    this.emptyState = this.root.locator(".empty-state");

    this.emptyStateTitle = this.emptyState.getByRole("heading", {
      name: "No products yet.",
      level: 2,
      exact: true,
    });

    this.emptyStateDescription = this.emptyState.getByText(
      "Create the first product to make it available in the catalog.",
      {
        exact: true,
      },
    );

    this.emptyStateCreateProductLink = this.emptyState.getByRole("link", {
      name: "Create product",
      exact: true,
    });

    this.table = this.root.getByRole("table", {
      name: "Admin products",
      exact: true,
    });

    this.columnHeaders = this.table.getByRole("columnheader");

    this.editLinks = this.table.getByRole("link", {
      name: /^Edit /,
    });
  }

  async open(): Promise<void> {
    await this.page.goto("/admin/products");
  }

  getProductRow(productTitle: string): Locator {
    const title = this.page.getByText(productTitle, {
      exact: true,
    });

    return this.table.getByRole("row").filter({
      has: title,
    });
  }

  getProductRowHeader(productTitle: string): Locator {
    return this.getProductRow(productTitle).getByRole("rowheader");
  }

  // The Product column is a row header, so the remaining cells start with Category.
  getProductCategoryCell(productTitle: string): Locator {
    return this.getProductRow(productTitle).getByRole("cell").nth(0);
  }

  getProductPriceCell(productTitle: string): Locator {
    return this.getProductRow(productTitle).getByRole("cell").nth(1);
  }

  getProductStockCell(productTitle: string): Locator {
    return this.getProductRow(productTitle).getByRole("cell").nth(2);
  }

  // Product images are decorative, so locate the image element within the row.
  getProductImage(productTitle: string): Locator {
    return this.getProductRow(productTitle).locator("img");
  }

  getEditProductLink(productTitle: string): Locator {
    return this.getProductRow(productTitle).getByRole("link", {
      name: `Edit ${productTitle}`,
      exact: true,
    });
  }
}
