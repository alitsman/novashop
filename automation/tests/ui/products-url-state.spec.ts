import { expect, test } from "../../src/fixtures";
import { ProductCatalogPage } from "../../src/pages";
import { authenticateUser, prepareProductCatalog } from "../../src/helpers";
import {
  createProduct,
  CATALOG_PRODUCTS,
  REGULAR_USER,
} from "../../src/test-data";

const MOUSE_CATEGORY_ELECTRONICS_PRICE_DESC = [
  "Gaming Mouse",
  "Wireless Mouse",
];
const MOUSE_NO_CATEGORY_PRICE_DEFAULT = [
  "Wireless Mouse",
  "Gaming Mouse",
  "Computer Mouse Handbook",
];

test.describe("product catalog URL state", () => {
  let catalogPage: ProductCatalogPage;

  test.beforeEach(async ({ page }) => {
    await authenticateUser(page, REGULAR_USER);

    const products = CATALOG_PRODUCTS.map((product) => createProduct(product));
    await prepareProductCatalog(page, products);

    catalogPage = new ProductCatalogPage(page);
  });

  test("writes filters to the URL and clears them", async ({ page }) => {
    await catalogPage.open();

    await catalogPage.searchFor("mouse");
    await expect(page).toHaveURL("/products?q=mouse");

    await catalogPage.filterByCategory("Electronics");
    await expect(page).toHaveURL("/products?q=mouse&category=Electronics");

    await catalogPage.sortByPrice("price-asc");
    await expect(page).toHaveURL(
      "/products?q=mouse&category=Electronics&sort=price-asc",
    );

    await catalogPage.clearSearchButton.click();
    await expect(page).toHaveURL(
      "/products?category=Electronics&sort=price-asc",
    );

    await catalogPage.clearFiltersButton.click();
    await expect(page).toHaveURL("/products");
  });

  test("restores filters and results from a direct URL", async ({ page }) => {
    // Parameters are deliberately out of canonical order: a valid deep link is
    // accepted in any order and then rewritten to q, category, sort.
    await page.goto("/products?sort=price-desc&category=Electronics&q=mouse");

    await expect(catalogPage.searchInput).toHaveValue("mouse");
    await expect(catalogPage.categorySelect).toHaveValue("Electronics");
    await expect(catalogPage.sortSelect).toHaveValue("price-desc");
    await expect(catalogPage.productTitles).toHaveText(
      MOUSE_CATEGORY_ELECTRONICS_PRICE_DESC,
    );
    await expect(page).toHaveURL(
      "/products?q=mouse&category=Electronics&sort=price-desc",
    );
  });

  test("preserves filters and results after reload", async ({ page }) => {
    await catalogPage.open();

    await catalogPage.searchFor("mouse");
    await expect(page).toHaveURL("/products?q=mouse");

    await catalogPage.filterByCategory("Electronics");
    await expect(page).toHaveURL("/products?q=mouse&category=Electronics");

    await catalogPage.sortByPrice("price-desc");
    await expect(page).toHaveURL(
      "/products?q=mouse&category=Electronics&sort=price-desc",
    );

    await page.reload();

    await expect(catalogPage.searchInput).toHaveValue("mouse");
    await expect(catalogPage.categorySelect).toHaveValue("Electronics");
    await expect(catalogPage.sortSelect).toHaveValue("price-desc");
    await expect(catalogPage.productTitles).toHaveText(
      MOUSE_CATEGORY_ELECTRONICS_PRICE_DESC,
    );
    await expect(page).toHaveURL(
      "/products?q=mouse&category=Electronics&sort=price-desc",
    );
  });

  test("restores filter states with browser Back and Forward", async ({
    page,
  }) => {
    await test.step("Build filter history", async () => {
      await catalogPage.open();

      await catalogPage.searchFor("mouse");
      await expect(page).toHaveURL("/products?q=mouse");

      await catalogPage.filterByCategory("Electronics");
      await expect(page).toHaveURL("/products?q=mouse&category=Electronics");

      await catalogPage.sortByPrice("price-desc");
      await expect(page).toHaveURL(
        "/products?q=mouse&category=Electronics&sort=price-desc",
      );

      await catalogPage.clearFiltersButton.click();
      await expect(page).toHaveURL("/products");
    });

    await test.step("Back restores the sorted state", async () => {
      // Regression: the query restored by Back must remain stable after Clear filters.
      await page.goBack();

      await expect(catalogPage.searchInput).toHaveValue("mouse");
      await expect(catalogPage.categorySelect).toHaveValue("Electronics");
      await expect(catalogPage.sortSelect).toHaveValue("price-desc");
      await expect(catalogPage.productTitles).toHaveText(
        MOUSE_CATEGORY_ELECTRONICS_PRICE_DESC,
      );
      await expect(page).toHaveURL(
        "/products?q=mouse&category=Electronics&sort=price-desc",
      );
    });

    await test.step("Back restores the category state", async () => {
      await page.goBack();

      await expect(catalogPage.searchInput).toHaveValue("mouse");
      await expect(catalogPage.categorySelect).toHaveValue("Electronics");
      await expect(catalogPage.sortSelect).toHaveValue("default");
      await expect(page).toHaveURL("/products?q=mouse&category=Electronics");
    });

    await test.step("Back restores the search-only state", async () => {
      await page.goBack();

      await expect(catalogPage.searchInput).toHaveValue("mouse");
      await expect(catalogPage.categorySelect).toHaveValue("");
      await expect(catalogPage.sortSelect).toHaveValue("default");
      await expect(page).toHaveURL("/products?q=mouse");
    });

    await test.step("Forward restores the category state", async () => {
      await page.goForward();

      await expect(catalogPage.searchInput).toHaveValue("mouse");
      await expect(catalogPage.categorySelect).toHaveValue("Electronics");
      await expect(catalogPage.sortSelect).toHaveValue("default");
      await expect(page).toHaveURL("/products?q=mouse&category=Electronics");
    });

    await test.step("Forward restores the sorted state", async () => {
      await page.goForward();

      await expect(catalogPage.searchInput).toHaveValue("mouse");
      await expect(catalogPage.categorySelect).toHaveValue("Electronics");
      await expect(catalogPage.sortSelect).toHaveValue("price-desc");
      await expect(page).toHaveURL(
        "/products?q=mouse&category=Electronics&sort=price-desc",
      );
    });

    await test.step("Forward restores the cleared state", async () => {
      await page.goForward();

      await expect(catalogPage.searchInput).toHaveValue("");
      await expect(catalogPage.categorySelect).toHaveValue("");
      await expect(catalogPage.sortSelect).toHaveValue("default");
      await expect(page).toHaveURL("/products");
    });
  });

  test("normalizes search and removes unsupported URL parameters", async ({
    page,
  }) => {
    // q is valid after trimming; category and sort have invalid values;
    // view is not a supported catalog parameter.
    await page.goto(
      "/products?q=%20mouse%20&category=Unknown&sort=price-up&view=grid",
    );

    // Category validation is postponed until products are loaded,
    // so wait for the final filtered results before asserting the URL.
    await expect(catalogPage.productTitles).toHaveText(
      MOUSE_NO_CATEGORY_PRICE_DEFAULT,
    );

    await expect(catalogPage.searchInput).toHaveValue("mouse");
    await expect(catalogPage.categorySelect).toHaveValue("");
    await expect(catalogPage.sortSelect).toHaveValue("default");
    await expect(page).toHaveURL("/products?q=mouse");
  });
});
