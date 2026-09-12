import type { Locator, Page } from "@playwright/test";

export class HeaderComponent {
  readonly root: Locator;

  readonly currentUserName: Locator;
  readonly logoutButton: Locator;

  readonly productsLink: Locator;
  readonly cartLink: Locator;
  readonly myOrdersLink: Locator;

  readonly manageProducts: Locator;

  constructor(page: Page) {
    this.root = page.getByRole("banner");

    this.currentUserName = this.root.getByTestId("current-user-name");

    this.logoutButton = this.root.getByRole("button", {
      name: "Logout",
      exact: true,
    });

    this.productsLink = this.root.getByRole("link", {
      name: "Products",
      exact: true,
    });

    this.cartLink = this.root.getByRole("link", {
      name: /^Cart,/,
    });

    this.myOrdersLink = this.root.getByRole("link", {
      name: "My orders",
      exact: true,
    });

    this.manageProducts = this.root.getByRole("link", {
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
