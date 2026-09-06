import { expect, test } from "../../src/fixtures";
import { LoginPage, ProductCatalogPage } from "../../src/pages";
import { ADMIN_USER, REGULAR_USER } from "../../src/test-data";

const INVALID_PASSWORD = "wrongPassword";

test.describe("login", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.open();
  });

  test("invalid credentials: shows an error", async () => {
    await loginPage.signIn(ADMIN_USER.user.email, INVALID_PASSWORD);

    await expect(loginPage.errorMessage).toHaveText("Email address or password is incorrect.");
    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.signInButton).toBeEnabled();
  });

  test("regular user: signs in successfully", async ({ page }) => {
    await loginPage.signIn(REGULAR_USER.user.email, REGULAR_USER.password);

    await expect(page).toHaveURL("/products");

    const catalogPage = new ProductCatalogPage(page);

    await expect(catalogPage.heading).toBeVisible();
    await expect(catalogPage.header.currentUserName).toHaveText(REGULAR_USER.user.name);
    await expect(catalogPage.header.logoutButton).toBeVisible();
  });
});
