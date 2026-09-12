import { randomUUID } from "node:crypto";

import { apiUrl } from "../../src/config/playwright.shared";
import { expect, test } from "../../src/fixtures";
import { holdRequestUntilReleased } from "../../src/helpers";
import { LoginPage, ProductCatalogPage, RegisterPage } from "../../src/pages";
import { REGULAR_USER } from "../../src/test-data";

const LOGIN_API_URL = new URL("/auth/login", apiUrl).toString();
const REGISTER_API_URL = new URL("/auth/register", apiUrl).toString();

const REGISTRATION_NAME = "Pending Registration User";
const REGISTRATION_PASSWORD = "PendingPassword1!";

test.describe("authentication pending state", () => {
  test("login: shows pending state and prevents duplicate submission", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const catalogPage = new ProductCatalogPage(page);

    await loginPage.open();
    await loginPage.emailInput.fill(REGULAR_USER.user.email);
    await loginPage.passwordInput.fill(REGULAR_USER.password);

    let loginRequestCount = 0;

    page.on("request", (request) => {
      if (request.url() === LOGIN_API_URL && request.method() === "POST") {
        loginRequestCount += 1;
      }
    });

    const heldLoginRequest = await holdRequestUntilReleased(page, {
      url: LOGIN_API_URL,
      method: "POST",
    });

    try {
      // Observe the request concurrently with the click so a deadline rejection
      // cannot become temporarily unhandled while Playwright is completing the action.
      await Promise.all([loginPage.signInButton.click(), heldLoginRequest.requestObserved]);

      await expect(loginPage.signingInButton).toBeDisabled();
      await expect(loginPage.signingInButton).toHaveAttribute("aria-busy", "true");
      await expect(loginPage.signingInButton).toHaveText("Signing in...");
      await expect(loginPage.statusMessage).toHaveText("Signing in, please wait.");

      await loginPage.passwordInput.press("Enter");

      await expect(loginPage.signingInButton).toBeDisabled();
    } finally {
      heldLoginRequest.release();
      await heldLoginRequest.dispose();
    }

    await expect(page).toHaveURL("/products");
    await expect(catalogPage.heading).toBeVisible();
    await expect(catalogPage.header.currentUserName).toHaveText(REGULAR_USER.user.name);

    expect(loginRequestCount).toBe(1);
  });

  test("registration: shows pending state and prevents duplicate submission", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const catalogPage = new ProductCatalogPage(page);
    const registrationEmail = `pending-registration-${randomUUID()}@test.com`;

    await registerPage.open();
    await registerPage.nameInput.fill(REGISTRATION_NAME);
    await registerPage.emailInput.fill(registrationEmail);
    await registerPage.passwordInput.fill(REGISTRATION_PASSWORD);
    await registerPage.confirmPasswordInput.fill(REGISTRATION_PASSWORD);

    let registerRequestCount = 0;

    page.on("request", (request) => {
      if (request.url() === REGISTER_API_URL && request.method() === "POST") {
        registerRequestCount += 1;
      }
    });

    const heldRegisterRequest = await holdRequestUntilReleased(page, {
      url: REGISTER_API_URL,
      method: "POST",
    });

    try {
      // Observe the request concurrently with the click so a deadline rejection
      // cannot become temporarily unhandled while Playwright is completing the action.
      await Promise.all([
        registerPage.createAccountButton.click(),
        heldRegisterRequest.requestObserved,
      ]);

      await expect(registerPage.creatingAccountButton).toBeDisabled();
      await expect(registerPage.creatingAccountButton).toHaveAttribute("aria-busy", "true");
      await expect(registerPage.creatingAccountButton).toHaveText("Creating account...");
      await expect(registerPage.statusMessage).toHaveText("Creating your account, please wait.");

      await registerPage.confirmPasswordInput.press("Enter");

      await expect(registerPage.creatingAccountButton).toBeDisabled();
    } finally {
      heldRegisterRequest.release();
      await heldRegisterRequest.dispose();
    }

    await expect(page).toHaveURL("/products");
    await expect(catalogPage.heading).toBeVisible();
    await expect(catalogPage.header.currentUserName).toHaveText(REGISTRATION_NAME);

    expect(registerRequestCount).toBe(1);
  });
});
