import { AppBootstrapScreenComponent, HeaderComponent } from "../../src/components";
import { Browser, apiUrl } from "../../src/config/playwright.shared";
import { expect, test } from "../../src/fixtures";
import {
  holdRequestUntilReleased,
  prepareMockedAuthenticatedSession,
  prepareProductCatalog,
} from "../../src/helpers";
import { NotFoundPage, ProductCatalogPage } from "../../src/pages";
import { REGULAR_USER } from "../../src/test-data";

const UNKNOWN_ROUTE = "/application-shell/not-found-check";
const CURRENT_USER_API_URL = new URL("/me", apiUrl).toString();

test.describe("application shell", () => {
  test("unknown route: shows the not found page inside the common layout", async ({ page }) => {
    const notFoundPage = new NotFoundPage(page);

    await page.goto(UNKNOWN_ROUTE);

    await expect(page).toHaveURL(UNKNOWN_ROUTE);
    await expect(page).toHaveTitle("Page not found | NovaShop");

    await expect(notFoundPage.header.root).toBeVisible();
    await expect(notFoundPage.heading).toBeVisible();

    await expect(notFoundPage.goToProductsLink).toBeVisible();
    await expect(notFoundPage.goToProductsLink).toHaveAttribute("href", "/products");
  });

  test.describe("skip link", () => {
    test.skip(
      ({ browserName }) => browserName === Browser.Webkit,
      "Tab and Alt+Tab do not move focus to links in Playwright WebKit in this environment",
    );

    test("moves keyboard focus to the main content", async ({ page }) => {
      const notFoundPage = new NotFoundPage(page);

      await page.goto(UNKNOWN_ROUTE);

      // Wait for the skip link before pressing Tab because keyboard actions are not retried.
      await expect(notFoundPage.layout.skipLink).toBeAttached();

      await page.keyboard.press("Tab");
      await expect(notFoundPage.layout.skipLink).toBeFocused();

      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(`${UNKNOWN_ROUTE}#main-content`);
      await expect(notFoundPage.layout.mainContent).toBeFocused();
    });
  });
});

test.describe("authenticated application shell", () => {
  test.beforeEach(async ({ page }) => {
    await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);
    await prepareProductCatalog(page, []);
  });

  test("authentication bootstrap: blocks route rendering until session restoration finishes", async ({
    page,
  }) => {
    const bootstrapScreen = new AppBootstrapScreenComponent(page);
    const catalogPage = new ProductCatalogPage(page);

    const heldCurrentUserRequest = await holdRequestUntilReleased(page, {
      url: CURRENT_USER_API_URL,
      method: "GET",
      fulfillWith: {
        status: 200,
        json: REGULAR_USER.user,
      },
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
