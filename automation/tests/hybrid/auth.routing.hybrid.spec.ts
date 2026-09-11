import { expect, test } from "../../src/fixtures";
import { loginViaApi, seedAuthTokenForEachPageLoad } from "../../src/helpers";
import { ProductCatalogPage } from "../../src/pages";
import { REGULAR_USER } from "../../src/test-data";

const adminRoutes = [
  "/admin/products",
  "/admin/products/new",
  "/admin/products/route-guard-check/edit",
];

const guestOnlyRoutes = ["/login", "/register"];

test.describe("authenticated route guards", () => {
  test.beforeEach(async ({ page, backendRequest }) => {
    const token = await loginViaApi(backendRequest, REGULAR_USER);

    await seedAuthTokenForEachPageLoad(page, token);
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
