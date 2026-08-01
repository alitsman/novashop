import { test, expect } from "@playwright/test";
import { LoginPage, ProductCatalogPage } from "../../src/pages";

test.describe("login", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.open();
  });

  test("invalid credentials: shows an error", async () => {
    await loginPage.signIn("admin@test.com", "wrongPassword");

    await expect(loginPage.errorMessage).toHaveText(
      "Email address or password is incorrect.",
    );
    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.signInButton).toBeEnabled();
  });

  test("regular user: signs in successfully", async ({ page }) => {
    await loginPage.signIn("user@test.com", "user123");

    await expect(page).toHaveURL("/products");

    const catalogPage = new ProductCatalogPage(page);

    await expect(catalogPage.heading).toBeVisible();
    await expect(catalogPage.header.currentUserName).toHaveText("Regular User");
    await expect(catalogPage.header.logoutButton).toBeVisible();
  });
});
