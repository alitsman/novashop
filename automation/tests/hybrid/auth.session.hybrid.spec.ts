import { apiUrl } from "../../src/config/playwright.shared";
import { expect, test } from "../../src/fixtures";
import { readAuthTokenStorageValue, seedAuthTokenOnce } from "../../src/helpers";
import { LoginPage } from "../../src/pages";

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
});
