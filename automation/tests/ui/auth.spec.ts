import { test, expect } from "@playwright/test";

test.describe("authentication", () => {
  test("shows an error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.getByLabel("Email address");
    const passwordInput = page.getByLabel("Password");
    const signInButton = page.getByRole("button", {
      name: "Sign in",
    });
    const loginError = page.getByRole("alert");

    await emailInput.fill("admin@test.com");
    await passwordInput.fill("wrongPassword");
    await signInButton.click();

    await expect(page).toHaveURL("/login");
    await expect(loginError).toBeVisible();
    await expect(loginError).toHaveText("Email address or password is incorrect.");
  });
});
