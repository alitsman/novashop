import { expect, test } from "../../src/fixtures";
import { LoginPage } from "../../src/pages";

const protectedRoutes = [
  "/products",
  "/products/route-guard-check",
  "/cart",
  "/checkout",
  "/orders",
] as const;

test.describe("protected routes", () => {
  for (const route of protectedRoutes) {
    test(`redirects unauthenticated user from ${route} to sign in`, async ({
      page,
    }) => {
      await page.goto(route);

      await expect(page).toHaveURL("/login");

      const loginPage = new LoginPage(page);

      await expect(loginPage.heading).toBeVisible();
    });
  }
});
