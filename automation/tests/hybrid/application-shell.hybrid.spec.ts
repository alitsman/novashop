import { AppBootstrapScreenComponent, HeaderComponent } from "../../src/components";
import { apiUrl } from "../../src/config/playwright.shared";
import { expect, test } from "../../src/fixtures";
import {
  holdRequestUntilReleased,
  loginViaApi,
  seedAuthTokenForEachPageLoad,
} from "../../src/helpers";
import { ProductCatalogPage } from "../../src/pages";
import { REGULAR_USER } from "../../src/test-data";

const CURRENT_USER_API_URL = new URL("/me", apiUrl).toString();

test.describe("application shell", () => {
  test.beforeEach(async ({ page, backendRequest }) => {
    const token = await loginViaApi(backendRequest, REGULAR_USER);

    await seedAuthTokenForEachPageLoad(page, token);
  });

  test("authentication bootstrap: blocks route rendering until session restoration finishes", async ({
    page,
  }) => {
    const bootstrapScreen = new AppBootstrapScreenComponent(page);
    const catalogPage = new ProductCatalogPage(page);

    const heldCurrentUserRequest = await holdRequestUntilReleased(page, {
      url: CURRENT_USER_API_URL,
      method: "GET",
    });

    try {
      await Promise.all([catalogPage.open(), heldCurrentUserRequest.requestObserved]);

      await expect(page).toHaveURL("/products");
      await expect(page).toHaveTitle("NovaShop");

      await expect(bootstrapScreen.restoringSessionStatus).toBeVisible();
      await expect(catalogPage.header.root).toBeVisible();
      await expect(catalogPage.header.productsLink).toBeHidden();
      await expect(catalogPage.heading).toBeHidden();
    } finally {
      heldCurrentUserRequest.release();
      await heldCurrentUserRequest.dispose();
    }

    await expect(bootstrapScreen.restoringSessionStatus).toBeHidden();
    await expect(page).toHaveURL("/products");
    await expect(catalogPage.heading).toBeVisible();
    await expect(catalogPage.header.currentUserName).toHaveText(REGULAR_USER.user.name);
  });

  test("root route: redirects an authenticated user to the product catalog", async ({ page }) => {
    const catalogPage = new ProductCatalogPage(page);

    await page.goto("/");

    await expect(page).toHaveURL("/products");
    await expect(catalogPage.heading).toBeVisible();
  });

  test("active navigation: moves current state from Products to Cart", async ({ page }) => {
    const catalogPage = new ProductCatalogPage(page);
    const header = new HeaderComponent(page);

    await catalogPage.open();

    await expect(header.productsLink).toHaveAttribute("aria-current", "page");

    await header.openCart();

    await expect(page).toHaveURL("/cart");
    await expect(header.productsLink).not.toHaveAttribute("aria-current", "page");
    await expect(header.cartLink).toHaveAttribute("aria-current", "page");
  });
});
