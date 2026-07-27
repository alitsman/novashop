import { test, expect } from "@playwright/test";
import { ProductCatalogPage } from "../../src/pages/product-catalog.page";
import { authenticateAsRegularUser } from "../../src/helpers/auth.helper";
import { prepareProductCatalog } from "../../src/helpers/product-catalog.helper";
import {
  CATALOG_PRODUCTS,
  EMPTY_CATALOG_PRODUCTS,
} from "../../src/test-data/product-catalog.data";
import { createProduct } from "../../src/test-data/product.factory";

test.describe("product catalog", () => {
  let catalogPage: ProductCatalogPage;

  test.beforeEach(async ({ page }) => {
    await authenticateAsRegularUser(page);

    const products = CATALOG_PRODUCTS.map((product) => createProduct(product));

    await prepareProductCatalog(page, products);

    catalogPage = new ProductCatalogPage(page);
    await catalogPage.open();

    await expect(
      catalogPage.header.currentUserName,
      "Regular user session should be restored",
    ).toHaveText("Regular User");
  });

  test("shows the complete catalog in default order", async () => {
    const expectedProductTitles = CATALOG_PRODUCTS.map(
      (product) => product.title,
    );

    await expect(catalogPage.productTitles).toHaveText(expectedProductTitles);
    await expect(catalogPage.productsStatus).toHaveText(
      `${expectedProductTitles.length} products found.`,
    );
    await expect(catalogPage.productsStatus).toHaveRole("status");
    await expect(catalogPage.searchInput).toHaveValue("");
    await expect(catalogPage.categorySelect).toHaveValue("");
    await expect(catalogPage.clearSearchButton).toHaveCount(0);
    await expect(catalogPage.sortSelect).toHaveValue("default");
    await expect(catalogPage.clearFiltersButton).toBeDisabled();
  });

  test("searches products by name and clears the search", async () => {
    const expectedDefaultProductTitles = CATALOG_PRODUCTS.map(
      (product) => product.title,
    );
    const expectedProductTitles = [
      "Wireless Mouse",
      "Gaming Mouse",
      "Computer Mouse Handbook",
    ];
    await catalogPage.searchFor(" MoUsE ");
    await expect(catalogPage.clearSearchButton).toBeVisible();
    await expect(catalogPage.productTitles).toHaveText(expectedProductTitles);
    await expect(catalogPage.productsStatus).toHaveText(
      `${expectedProductTitles.length} products found.`,
    );
    await catalogPage.clearSearchButton.click();
    await expect(catalogPage.searchInput).toHaveValue("");
    await expect(catalogPage.clearSearchButton).toHaveCount(0);
    await expect(catalogPage.productTitles).toHaveText(
      expectedDefaultProductTitles,
    );
    await expect(catalogPage.productsStatus).toHaveText(
      `${expectedDefaultProductTitles.length} products found.`,
    );
  });

  test("searches product names only and shows the no-results state", async () => {
    await catalogPage.searchFor("Electronics");
    await expect(catalogPage.productCards).toHaveCount(0);
    await expect(catalogPage.noResultsTitle).toBeVisible();
    await expect(catalogPage.productsStatus).toHaveText("0 products found.");

    await catalogPage.searchFor("comfortable");
    await expect(catalogPage.productCards).toHaveCount(0);
    await expect(catalogPage.noResultsTitle).toBeVisible();
    await expect(catalogPage.productsStatus).toHaveText("0 products found.");
  });

  test("filters products by category", async () => {
    const expectedProductTitles = CATALOG_PRODUCTS.filter(
      (product) => product.category === "Books",
    ).map((product) => product.title);
    await catalogPage.filterByCategory("Books");
    await expect(catalogPage.productCards).toHaveCount(
      expectedProductTitles.length,
    );
    await expect(catalogPage.productTitles).toHaveText(expectedProductTitles);
    await expect(catalogPage.productsStatus).toHaveText("1 product found.");
  });

  test("sorts products by price and restores default order", async () => {
    const expectedProductTitlesLowToHigh = [...CATALOG_PRODUCTS]
      .sort(
        (firstProduct, secondProduct) =>
          firstProduct.price - secondProduct.price,
      )
      .map((product) => product.title);

    const expectedProductTitlesHighToLow = [...CATALOG_PRODUCTS]
      .sort(
        (firstProduct, secondProduct) =>
          secondProduct.price - firstProduct.price,
      )
      .map((product) => product.title);

    const expectedDefaultProductTitles = CATALOG_PRODUCTS.map(
      (product) => product.title,
    );

    await catalogPage.sortByPrice("price-asc");
    await expect(catalogPage.productTitles).toHaveText(
      expectedProductTitlesLowToHigh,
    );

    await catalogPage.sortByPrice("price-desc");
    await expect(catalogPage.productTitles).toHaveText(
      expectedProductTitlesHighToLow,
    );

    await catalogPage.sortByPrice("default");
    await expect(catalogPage.productTitles).toHaveText(
      expectedDefaultProductTitles,
    );
  });

  test("combines search, category filtering, and sorting, then clears all filters", async () => {
    const expectedDefaultProductTitles = CATALOG_PRODUCTS.map(
      (product) => product.title,
    );
    const expectedFilteredProductTitles = ["Gaming Mouse", "Wireless Mouse"];

    await catalogPage.searchFor("mouse");
    await catalogPage.filterByCategory("Electronics");
    await catalogPage.sortByPrice("price-desc");

    await expect(catalogPage.searchInput).toHaveValue("mouse");
    await expect(catalogPage.categorySelect).toHaveValue("Electronics");
    await expect(catalogPage.sortSelect).toHaveValue("price-desc");
    await expect(catalogPage.clearFiltersButton).toBeEnabled();
    await expect(catalogPage.clearSearchButton).toBeVisible();
    await expect(catalogPage.productTitles).toHaveText(
      expectedFilteredProductTitles,
    );
    await expect(catalogPage.productsStatus).toHaveText(
      `${expectedFilteredProductTitles.length} products found.`,
    );

    await catalogPage.clearFiltersButton.click();

    await expect(catalogPage.searchInput).toHaveValue("");
    await expect(catalogPage.categorySelect).toHaveValue("");
    await expect(catalogPage.sortSelect).toHaveValue("default");
    await expect(catalogPage.clearFiltersButton).toBeDisabled();
    await expect(catalogPage.clearSearchButton).toHaveCount(0);
    await expect(catalogPage.productTitles).toHaveText(
      expectedDefaultProductTitles,
    );
    await expect(catalogPage.productsStatus).toHaveText(
      `${expectedDefaultProductTitles.length} products found.`,
    );
  });
});

test.describe("empty product catalog", () => {
  let catalogPage: ProductCatalogPage;

  test.beforeEach(async ({ page }) => {
    await authenticateAsRegularUser(page);

    await prepareProductCatalog(page, EMPTY_CATALOG_PRODUCTS);

    catalogPage = new ProductCatalogPage(page);
    await catalogPage.open();

    await expect(
      catalogPage.header.currentUserName,
      "Regular user session should be restored",
    ).toHaveText("Regular User");
  });

  test("shows the empty-catalog state when no products are available", async () => {
    await expect(catalogPage.emptyCatalogTitle).toBeVisible();
    await expect(catalogPage.productCards).toHaveCount(0);
  });
});
