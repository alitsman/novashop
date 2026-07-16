import { test, expect } from "@playwright/test";

const protectedRoutes = [
  "/products",
  "/products/route-guard-check",
  "/cart",
  "/checkout",
  "/orders",
] as const;

test.describe("protected routes", () => {
  for (const route of protectedRoutes) {
    test(`redirects unauthenticated user from ${route} to sign in`, async ({ page }) => {
      await page.goto(route);

      await expect(page).toHaveURL("/login");

      const signInHeading = page.getByRole("heading", {
        name: "Sign in",
      });
      await expect(signInHeading).toBeVisible();
    });
  }
});
