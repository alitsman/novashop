import { expect, test } from "../../src/fixtures";
import { prepareMockedAuthenticatedSession, prepareProductCatalog } from "../../src/helpers";
import { LoginPage, ProductCatalogPage } from "../../src/pages";
import { REGULAR_USER } from "../../src/test-data";

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

const adminRoutes = [
  "/admin/products",
  "/admin/products/new",
  "/admin/products/route-guard-check/edit",
];

const guestOnlyRoutes = ["/login", "/register"];

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

test.describe("authenticated route guards", () => {
  test.beforeEach(async ({ page }) => {
    await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);
    await prepareProductCatalog(page, []);
  });

  // The isolated guest-routing suite proves that these routes require authentication.
  // These cases separately prove that an authenticated regular user still lacks admin access.
  for (const route of adminRoutes) {
    test(`redirects a regular user from ${route} to /products`, async ({ page }) => {
      await page.goto(route);

      await expect(page).toHaveURL("/products");

      const catalogPage = new ProductCatalogPage(page);

      await expect(catalogPage.heading).toBeVisible();
      await expect(catalogPage.header.currentUserName).toHaveText(REGULAR_USER.user.name);
    });
  }

  for (const route of guestOnlyRoutes) {
    test(`redirects an authenticated user from ${route} to /products`, async ({ page }) => {
      await page.goto(route);

      await expect(page).toHaveURL("/products");

      const catalogPage = new ProductCatalogPage(page);

      await expect(catalogPage.heading).toBeVisible();
      await expect(catalogPage.header.currentUserName).toHaveText(REGULAR_USER.user.name);
    });
  }
});
