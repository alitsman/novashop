import { expect, test } from "../../src/fixtures";
import { NotFoundPage } from "../../src/pages";

const UNKNOWN_ROUTE = "/application-shell/not-found-check";

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

  test("skip link: moves keyboard focus to the main content", async ({ page }) => {
    const notFoundPage = new NotFoundPage(page);

    await page.goto(UNKNOWN_ROUTE);

    await page.keyboard.press("Tab");
    await expect(notFoundPage.layout.skipLink).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(`${UNKNOWN_ROUTE}#main-content`);
    await expect(notFoundPage.layout.mainContent).toBeFocused();
  });
});
