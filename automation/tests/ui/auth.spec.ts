import { test, expect } from "@playwright/test";

test.describe("login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("invalid credentials: shows an error", async ({ page }) => {
    const emailInput = page.getByLabel("Email address");
    const passwordInput = page.getByLabel("Password");
    const signInButton = page.getByRole("button", {
      name: "Sign in",
      exact: true,
    });
    const loginError = page.getByRole("alert");

    await emailInput.fill("admin@test.com");
    await passwordInput.fill("wrongPassword");
    await signInButton.click();

    await expect(page).toHaveURL("/login");
    await expect(loginError).toHaveText("Email address or password is incorrect.");
  });

  test("regular user: signs in successfully", async ({ page }) => {
    const emailInput = page.getByLabel("Email address");
    const passwordInput = page.getByLabel("Password");
    const signInButton = page.getByRole("button", {
      name: "Sign in",
      exact: true,
    });

    await emailInput.fill("user@test.com");
    await passwordInput.fill("user123");
    await signInButton.click();

    const userName = page.locator(".app-header__user-name");
    const logoutButton = page.getByRole("button", {
      name: "Logout",
      exact: true,
    });

    await expect(page).toHaveURL("/products");
    await expect(userName).toHaveText("Regular User");
    await expect(logoutButton).toBeVisible();
  });
});
