import { expect, test } from "../../src/fixtures";
import { LoginPage } from "../../src/pages";

const routesRequiringAuthentication = [
  "/products",
  "/products/route-guard-check",
  "/cart",
  "/checkout",
  "/orders",
  "/admin/products",
  "/admin/products/new",
  "/admin/products/route-guard-check/edit",
];

test.describe("routes requiring authentication", () => {
  for (const route of routesRequiringAuthentication) {
    test(`redirects unauthenticated user from ${route} to sign in`, async ({ page }) => {
      await page.goto(route);

      await expect(page).toHaveURL("/login");

      const loginPage = new LoginPage(page);

      await expect(loginPage.heading).toBeVisible();
    });
  }
});
