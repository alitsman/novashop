import { randomUUID } from "node:crypto";

import { apiUrl } from "../../src/config/playwright.shared";
import { expect, test } from "../../src/fixtures";
import { readAuthTokenStorageValue } from "../../src/helpers";
import { LoginPage, ProductCatalogPage, RegisterPage } from "../../src/pages";
import { ADMIN_USER, REGULAR_USER } from "../../src/test-data";

const CURRENT_USER_API_URL = new URL("/me", apiUrl).toString();
const LOGIN_API_URL = new URL("/auth/login", apiUrl).toString();
const REGISTER_API_URL = new URL("/auth/register", apiUrl).toString();

const INVALID_PASSWORD = "wrongPassword";
const REGISTRATION_NAME = "E2E Registration User";
const REGISTRATION_PASSWORD = "NewUser123!";

test.describe("login", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.open();
  });

  test("regular user: signs in and restores the session after reload", async ({ page }) => {
    await loginPage.signIn(REGULAR_USER.user.email, REGULAR_USER.password);

    await expect(page).toHaveURL("/products");

    const catalogPage = new ProductCatalogPage(page);

    await expect(catalogPage.heading).toBeVisible();
    await expect(catalogPage.header.currentUserName).toHaveText(REGULAR_USER.user.name);
    await expect(catalogPage.header.logoutButton).toBeVisible();

    // Start waiting before reload so Playwright does not miss a fast /me response.
    const restoreAuthResponsePromise = page.waitForResponse(
      (response) =>
        response.url() === CURRENT_USER_API_URL && response.request().method() === "GET",
    );

    await page.reload();

    const restoreAuthResponse = await restoreAuthResponsePromise;

    expect(restoreAuthResponse.status()).toBe(200);

    await expect(page).toHaveURL("/products");
    await expect(catalogPage.heading).toBeVisible();
    await expect(catalogPage.header.currentUserName).toHaveText(REGULAR_USER.user.name);
    await expect(catalogPage.header.logoutButton).toBeVisible();
  });

  test("invalid credentials: shows an error and remains signed out", async ({ page }) => {
    // Start waiting before submit so Playwright does not miss a fast login response.
    const loginResponsePromise = page.waitForResponse(
      (response) => response.url() === LOGIN_API_URL && response.request().method() === "POST",
    );

    await loginPage.signIn(ADMIN_USER.user.email, INVALID_PASSWORD);

    const loginResponse = await loginResponsePromise;

    expect(loginResponse.status()).toBe(401);

    await expect(page).toHaveURL("/login");
    await expect(loginPage.errorMessage).toHaveText("Email address or password is incorrect.");
    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.signInButton).toBeEnabled();

    expect(await readAuthTokenStorageValue(page)).toBeNull();

    await loginPage.passwordInput.fill(ADMIN_USER.password);

    await expect(loginPage.errorMessage).toBeHidden();
  });
});

test.describe("registration", () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.open();
  });

  test("new user: registers as a regular user and restores the session after reload", async ({
    page,
  }) => {
    const registrationEmail = `e2e-registration-${randomUUID()}@test.com`;

    // Start waiting before submit so Playwright does not miss a fast registration response.
    const registerResponsePromise = page.waitForResponse(
      (response) => response.url() === REGISTER_API_URL && response.request().method() === "POST",
    );

    await registerPage.register(REGISTRATION_NAME, registrationEmail, REGISTRATION_PASSWORD);

    const registerResponse = await registerResponsePromise;

    expect(registerResponse.status()).toBe(201);

    await expect(page).toHaveURL("/products");

    const catalogPage = new ProductCatalogPage(page);

    await expect(catalogPage.heading).toBeVisible();
    await expect(catalogPage.header.currentUserName).toHaveText(REGISTRATION_NAME);
    await expect(catalogPage.header.logoutButton).toBeVisible();
    await expect(catalogPage.header.manageProducts).toBeHidden();

    // Start waiting before reload so Playwright does not miss a fast /me response.
    const restoreAuthResponsePromise = page.waitForResponse(
      (response) =>
        response.url() === CURRENT_USER_API_URL && response.request().method() === "GET",
    );

    await page.reload();

    const restoreAuthResponse = await restoreAuthResponsePromise;

    expect(restoreAuthResponse.status()).toBe(200);

    await expect(page).toHaveURL("/products");
    await expect(catalogPage.heading).toBeVisible();
    await expect(catalogPage.header.currentUserName).toHaveText(REGISTRATION_NAME);
    await expect(catalogPage.header.logoutButton).toBeVisible();
    await expect(catalogPage.header.manageProducts).toBeHidden();
  });

  test("existing email: shows an error and remains signed out", async ({ page }) => {
    // Start waiting before submit so Playwright does not miss a fast registration response.
    const registerResponsePromise = page.waitForResponse(
      (response) => response.url() === REGISTER_API_URL && response.request().method() === "POST",
    );

    // REGULAR_USER mirrors a seeded account, so its email already exists.
    await registerPage.register(REGISTRATION_NAME, REGULAR_USER.user.email, REGISTRATION_PASSWORD);

    const registerResponse = await registerResponsePromise;

    expect(registerResponse.status()).toBe(409);

    await expect(page).toHaveURL("/register");
    await expect(registerPage.errorMessage).toHaveText("Email already exists");
    await expect(registerPage.heading).toBeVisible();
    await expect(registerPage.createAccountButton).toBeEnabled();

    expect(await readAuthTokenStorageValue(page)).toBeNull();

    await registerPage.emailInput.fill(`available-${randomUUID()}@test.com`);

    await expect(registerPage.errorMessage).toBeHidden();
  });
});
