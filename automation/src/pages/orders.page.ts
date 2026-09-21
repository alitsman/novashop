import type { Locator, Page } from "@playwright/test";

import { HeaderComponent } from "../components";

export class OrdersPage {
  private readonly page: Page;

  readonly root: Locator;
  readonly header: HeaderComponent;

  readonly heading: Locator;
  readonly ordersList: Locator;

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

    this.ordersList = this.root.getByRole("list", {
      name: "Orders",
      exact: true,
    });
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
