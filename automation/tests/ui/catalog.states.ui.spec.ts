import { expect, test } from "../../src/fixtures";
import {
  holdProductCatalogUntilReleased,
  prepareMockedAuthenticatedSession,
  prepareProductCatalogNetworkFailure,
} from "../../src/helpers";
import { ProductCatalogPage } from "../../src/pages";
import { CATALOG_PRODUCTS, REGULAR_USER, createProduct } from "../../src/test-data";

test.describe("product catalog states", () => {
  test("preserves a valid direct-link category through initial loading", async ({ page }) => {
    const catalogProducts = CATALOG_PRODUCTS.map((product) => createProduct(product));
    const expectedProductTitles = catalogProducts
      .filter((product) => product.category === "Electronics")
      .map((product) => product.title);

    await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);

    const heldCatalogRequest = await holdProductCatalogUntilReleased(page, catalogProducts);
    const catalogPage = new ProductCatalogPage(page);

    try {
      await Promise.all([
        page.goto("/products?category=Electronics"),
        heldCatalogRequest.requestObserved,
      ]);

      await expect(catalogPage.loadingStatus).toBeVisible();
      await expect(catalogPage.searchInput).toHaveCount(0);
      await expect(catalogPage.productList).toHaveCount(0);
      await expect(catalogPage.errorAlert).toHaveCount(0);
      await expect(catalogPage.emptyCatalogTitle).toHaveCount(0);
      await expect(catalogPage.noResultsTitle).toHaveCount(0);
      await expect(page).toHaveURL("/products?category=Electronics");
    } finally {
      heldCatalogRequest.release();
      await heldCatalogRequest.dispose();
    }

    await expect(catalogPage.loadingStatus).toBeHidden();
    await expect(catalogPage.categorySelect).toHaveValue("Electronics");
    await expect(catalogPage.productTitles).toHaveText(expectedProductTitles);

    // Category validation can now run against the loaded catalog,
    // so the valid value must remain in the canonical URL.
    await expect(page).toHaveURL("/products?category=Electronics");
  });

  test("shows a standalone error state when the product request cannot reach the server", async ({
    page,
  }) => {
    await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);
    await prepareProductCatalogNetworkFailure(page);

    const catalogPage = new ProductCatalogPage(page);

    await catalogPage.open();

    await expect(catalogPage.errorAlert).toBeVisible();
    await expect(catalogPage.errorAlert).toContainText("Unable to connect to the server.");
    await expect(catalogPage.loadingStatus).toBeHidden();
    await expect(catalogPage.searchInput).toHaveCount(0);
    await expect(catalogPage.productList).toHaveCount(0);
    await expect(catalogPage.emptyCatalogTitle).toHaveCount(0);
    await expect(catalogPage.noResultsTitle).toHaveCount(0);
  });
});
