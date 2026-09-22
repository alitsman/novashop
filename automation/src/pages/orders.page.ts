import type { Locator, Page } from "@playwright/test";

import { HeaderComponent } from "../components";

export class OrdersPage {
  private readonly page: Page;

  readonly root: Locator;
  readonly header: HeaderComponent;

  readonly heading: Locator;
  readonly loadingStatus: Locator;
  readonly emptyStateTitle: Locator;
  readonly goToProductsLink: Locator;
  readonly errorAlert: Locator;
  readonly ordersList: Locator;
  readonly continueShoppingLink: Locator;

  constructor(page: Page) {
    this.page = page;

    this.root = this.page.getByRole("region", {
      name: "My Orders",
      exact: true,
    });

    this.header = new HeaderComponent(this.page);

    this.heading = this.root.getByRole("heading", {
      name: "My Orders",
      level: 1,
      exact: true,
    });

    // The Loader has no accessible name, so identify it by its visible message.
    this.loadingStatus = this.root.getByRole("status").filter({
      hasText: /^Loading orders\.\.\.$/,
    });

    this.emptyStateTitle = this.root.getByRole("heading", {
      name: "No orders yet",
      level: 2,
      exact: true,
    });

    this.goToProductsLink = this.root.getByRole("link", {
      name: "Go to products",
      exact: true,
    });

    const errorTitle = this.page.getByRole("heading", {
      name: "Failed to load orders.",
      level: 2,
      exact: true,
    });

    this.errorAlert = this.root.getByRole("alert").filter({
      has: errorTitle,
    });

    this.ordersList = this.root.getByRole("list", {
      name: "Orders",
      exact: true,
    });

    this.continueShoppingLink = this.root.getByRole("link", {
      name: "Continue shopping",
      exact: true,
    });
  }

  async open(): Promise<void> {
    await this.page.goto("/orders");
  }

  getOrder(orderNumber: number): Locator {
    return this.ordersList.getByRole("article", {
      name: `Order #${orderNumber}`,
      exact: true,
    });
  }

  getOrderTotal(orderNumber: number): Locator {
    return this.getOrder(orderNumber).getByTestId("order-total");
  }

  getOrderProduct(orderNumber: number, productTitle: string): Locator {
    const productsList = this.getOrder(orderNumber).getByRole("list", {
      name: `Products in Order #${orderNumber}`,
      exact: true,
    });

    const productTitleLocator = this.page.getByText(productTitle, {
      exact: true,
    });

    return productsList.getByRole("listitem").filter({
      has: productTitleLocator,
    });
  }
}
