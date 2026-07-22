import type { Locator, Page } from "@playwright/test";

export class HeaderComponent {
  readonly currentUserName: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    const root = page.getByRole("banner");

    this.currentUserName = root.getByTestId("current-user-name");
    this.logoutButton = root.getByRole("button", {
      name: "Logout",
      exact: true,
    });
  }
}
