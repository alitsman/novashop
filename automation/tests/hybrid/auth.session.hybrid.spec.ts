import { apiUrl } from "../../src/config/playwright.shared";
import { expect, test } from "../../src/fixtures";
import { loginViaApi, readAuthTokenStorageValue, seedAuthTokenOnce } from "../../src/helpers";
import { LoginPage, ProductCatalogPage } from "../../src/pages";
import { REGULAR_USER } from "../../src/test-data";

const INVALID_AUTH_TOKEN = "invalid-auth-token";
const CURRENT_USER_API_URL = new URL("/me", apiUrl).toString();

test.describe("authentication session lifecycle", () => {
  test("invalid stored token: clears the session and remains signed out after reload", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);

    await loginPage.open();
    await expect(loginPage.heading).toBeVisible();

    await seedAuthTokenOnce(page, INVALID_AUTH_TOKEN);

    expect(await readAuthTokenStorageValue(page)).toBe(JSON.stringify(INVALID_AUTH_TOKEN));

    const restoreAuthResponsePromise = page.waitForResponse(
      (response) =>
        response.url() === CURRENT_USER_API_URL && response.request().method() === "GET",
    );

    await page.goto("/products");

    const restoreAuthResponse = await restoreAuthResponsePromise;

    expect(restoreAuthResponse.status()).toBe(401);

    await expect(page).toHaveURL("/login");
    await expect(loginPage.heading).toBeVisible();

    expect(await readAuthTokenStorageValue(page)).toBeNull();

    await page.reload();

    await expect(page).toHaveURL("/login");
    await expect(loginPage.heading).toBeVisible();

    expect(await readAuthTokenStorageValue(page)).toBeNull();
  });

  test("logout: clears the session and remains signed out after reload", async ({
    page,
    backendRequest,
  }) => {
    const loginPage = new LoginPage(page);
    const catalogPage = new ProductCatalogPage(page);
    const token = await loginViaApi(backendRequest, REGULAR_USER);

    await loginPage.open();
    await expect(loginPage.heading).toBeVisible();

    await seedAuthTokenOnce(page, token);

    expect(await readAuthTokenStorageValue(page)).toBe(JSON.stringify(token));

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
