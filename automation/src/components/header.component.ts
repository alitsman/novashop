import type { Locator, Page } from "@playwright/test";

export class HeaderComponent {
  readonly currentUserName: Locator;
  readonly logoutButton: Locator;

  readonly productsLink: Locator;
  readonly cartLink: Locator;
  readonly myOrdersLink: Locator;

  readonly manageProducts: Locator;

  constructor(page: Page) {
    const root = page.getByRole("banner");

    this.currentUserName = root.getByTestId("current-user-name");

    this.logoutButton = root.getByRole("button", {
      name: "Logout",
      exact: true,
    });

    this.productsLink = root.getByRole("link", {
      name: "Products",
      exact: true,
    });

    this.cartLink = root.getByRole("link", {
      name: /^Cart,/,
    });

    this.myOrdersLink = root.getByRole("link", {
      name: "My orders",
      exact: true,
    });

    this.manageProducts = root.getByRole("link", {
      name: "Manage products",
      exact: true,
    });
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }
}
