import { expect, test } from "../../src/fixtures";
import {
  prepareCurrentUser,
  prepareProductCatalog,
  readAuthTokenStorageValue,
  seedAuthTokenOnce,
} from "../../src/helpers";
import { LoginPage, ProductCatalogPage } from "../../src/pages";
import { REGULAR_USER } from "../../src/test-data";

const AUTH_TOKEN = "synthetic-auth-token";

test.describe("authentication session lifecycle", () => {
  test("logout: clears the session and remains signed out after reload", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const catalogPage = new ProductCatalogPage(page);

    await prepareCurrentUser(page, REGULAR_USER.user);
    await prepareProductCatalog(page, []);

    await loginPage.open();
    await expect(loginPage.heading).toBeVisible();

    await seedAuthTokenOnce(page, AUTH_TOKEN);

    expect(await readAuthTokenStorageValue(page)).toBe(JSON.stringify(AUTH_TOKEN));

    await catalogPage.open();

    await expect(page).toHaveURL("/products");
    await expect(catalogPage.heading).toBeVisible();
    await expect(catalogPage.header.currentUserName).toHaveText(REGULAR_USER.user.name);

    await catalogPage.header.logout();

    await expect(page).toHaveURL("/login");
    await expect(loginPage.heading).toBeVisible();
    expect(await readAuthTokenStorageValue(page)).toBeNull();

    await page.reload();

    await expect(page).toHaveURL("/login");
    await expect(loginPage.heading).toBeVisible();
    expect(await readAuthTokenStorageValue(page)).toBeNull();
  });
});
