import { expect, test } from "../../src/fixtures";
import { prepareMockedAuthenticatedSession, prepareProductCatalog } from "../../src/helpers";
import { ProductCatalogPage } from "../../src/pages";
import {
  CATALOG_PRODUCTS,
  CATALOG_REFERENCE_PRODUCT,
  EMPTY_CATALOG_PRODUCTS,
  REGULAR_USER,
  createProduct,
} from "../../src/test-data";
import { formatUsd } from "../../src/utils";

const REPRESENTATIVE_PRODUCT = createProduct(CATALOG_REFERENCE_PRODUCT);

test.describe("product catalog", () => {
  let catalogPage: ProductCatalogPage;

  test.beforeEach(async ({ page }) => {
    await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);

    const products = CATALOG_PRODUCTS.map((product) => createProduct(product));
    await prepareProductCatalog(page, products);

    catalogPage = new ProductCatalogPage(page);
    await catalogPage.open();

    await expect(
      catalogPage.header.currentUserName,
      "Regular user session should be restored",
    ).toHaveText(REGULAR_USER.user.name);
  });

  test("shows the complete catalog in default order", async () => {
    const expectedProductTitles = CATALOG_PRODUCTS.map((product) => product.title);

    await expect(catalogPage.heading).toBeVisible();
    await expect(catalogPage.productList).toBeVisible();
    await expect(catalogPage.productCards).toHaveCount(expectedProductTitles.length);
    await expect(catalogPage.productTitles).toHaveText(expectedProductTitles);
    await expect(catalogPage.productsStatus).toHaveText(
      `${expectedProductTitles.length} products found.`,
    );
    await expect(catalogPage.productsStatus).toHaveRole("status");

    await expect(catalogPage.searchInput).toHaveValue("");
    await expect(catalogPage.clearSearchButton).toHaveCount(0);
    await expect(catalogPage.categorySelect).toHaveValue("");
    await expect(catalogPage.sortSelect).toHaveValue("default");
    await expect(catalogPage.clearFiltersButton).toBeDisabled();

    await expect(catalogPage.loadingStatus).toHaveCount(0);
    await expect(catalogPage.errorAlert).toHaveCount(0);
    await expect(catalogPage.emptyCatalogTitle).toHaveCount(0);
    await expect(catalogPage.noResultsTitle).toHaveCount(0);
  });

  test("shows the complete mapping of a representative product card", async () => {
    const productCard = catalogPage.getProductCard(REPRESENTATIVE_PRODUCT.title);

    await expect(productCard.title).toHaveText(REPRESENTATIVE_PRODUCT.title);
    await expect(productCard.category).toHaveText(REPRESENTATIVE_PRODUCT.category);
    await expect(productCard.description).toHaveText(REPRESENTATIVE_PRODUCT.description);
    await expect(productCard.price).toHaveText(formatUsd(REPRESENTATIVE_PRODUCT.price));

    await expect(productCard.image).toHaveAttribute("src", REPRESENTATIVE_PRODUCT.imageUrl);
    await expect(productCard.image).toHaveAttribute("alt", "");

    await expect(productCard.detailsLink).toHaveAccessibleName(
      `View details for ${REPRESENTATIVE_PRODUCT.title}`,
    );
    await expect(productCard.detailsLink).toHaveAttribute(
      "href",
      `/products/${REPRESENTATIVE_PRODUCT.id}`,
    );

    await expect(productCard.addToCart.quantityInput).toHaveAccessibleName(
      `Quantity for ${REPRESENTATIVE_PRODUCT.title}`,
    );
    await expect(productCard.addToCart.addToCartButton).toHaveAccessibleName(
      `Add to cart: ${REPRESENTATIVE_PRODUCT.title}`,
    );
  });

  test("searches products by name and clears the search", async () => {
    const expectedDefaultProductTitles = CATALOG_PRODUCTS.map((product) => product.title);
    const expectedMouseProductTitles = [
      "Wireless Mouse",
      "Gaming Mouse",
      "Computer Mouse Handbook",
    ];

    await catalogPage.searchFor(" MoUsE ");

    await expect(catalogPage.clearSearchButton).toBeVisible();
    await expect(catalogPage.productTitles).toHaveText(expectedMouseProductTitles);
    await expect(catalogPage.productsStatus).toHaveText(
      `${expectedMouseProductTitles.length} products found.`,
    );

    await catalogPage.clearSearchButton.click();

    await expect(catalogPage.searchInput).toHaveValue("");
    await expect(catalogPage.clearSearchButton).toHaveCount(0);
    await expect(catalogPage.productTitles).toHaveText(expectedDefaultProductTitles);
    await expect(catalogPage.productsStatus).toHaveText(
      `${expectedDefaultProductTitles.length} products found.`,
    );

    await catalogPage.searchFor("Keyboard");

    await expect(catalogPage.productTitles).toHaveText(["Mechanical Keyboard"]);
    await expect(catalogPage.productsStatus).toHaveText("1 product found.");
  });

  test("searches product names only and shows the no-results state", async ({ page }) => {
    await catalogPage.searchFor("Electronics");

    await expect(catalogPage.productCards).toHaveCount(0);
    await expect(catalogPage.noResultsTitle).toBeVisible();
    await expect(catalogPage.noResultsDescription).toBeVisible();
    await expect(catalogPage.productsStatus).toHaveText("0 products found.");
    await expect(catalogPage.clearFiltersButton).toBeEnabled();
    await expect(catalogPage.emptyCatalogTitle).toHaveCount(0);

    await catalogPage.searchFor("comfortable");

    // The visible result remains empty for both searches, so wait for the URL
    // to prove that the debounced description-only query was applied.
    await expect(page).toHaveURL("/products?q=comfortable");
    await expect(catalogPage.productCards).toHaveCount(0);
    await expect(catalogPage.noResultsTitle).toBeVisible();
    await expect(catalogPage.noResultsDescription).toBeVisible();
  });

  test("filters products by category", async () => {
    const expectedCategories = [
      ...new Set(CATALOG_PRODUCTS.map((product) => product.category)),
    ].sort();

    await expect(catalogPage.categoryOptions).toHaveCount(expectedCategories.length + 1);
    await expect(catalogPage.categoryOptions.first()).toHaveText("All categories");
    await expect(catalogPage.categoryOptions.first()).toHaveAttribute("value", "");

    const actualCategories = await catalogPage.categoryOptions.evaluateAll((options) => {
      return options
        .slice(1)
        .map((option) => (option as HTMLOptionElement).value)
        .sort();
    });

    expect(actualCategories).toEqual(expectedCategories);

    const expectedProductTitles = CATALOG_PRODUCTS.filter(
      (product) => product.category === "Books",
    ).map((product) => product.title);

    await catalogPage.filterByCategory("Books");

    await expect(catalogPage.categorySelect).toHaveValue("Books");
    await expect(catalogPage.productCards).toHaveCount(expectedProductTitles.length);
    await expect(catalogPage.productTitles).toHaveText(expectedProductTitles);
    await expect(catalogPage.productsStatus).toHaveText("1 product found.");
  });

  test("sorts products by price and restores default order", async () => {
    const expectedProductTitlesLowToHigh = [...CATALOG_PRODUCTS]
      .sort((firstProduct, secondProduct) => firstProduct.price - secondProduct.price)
      .map((product) => product.title);

    const expectedProductTitlesHighToLow = [...CATALOG_PRODUCTS]
      .sort((firstProduct, secondProduct) => secondProduct.price - firstProduct.price)
      .map((product) => product.title);

    const expectedDefaultProductTitles = CATALOG_PRODUCTS.map((product) => product.title);

    await catalogPage.sortByPrice("price-asc");
    await expect(catalogPage.productTitles).toHaveText(expectedProductTitlesLowToHigh);

    await catalogPage.sortByPrice("price-desc");
    await expect(catalogPage.productTitles).toHaveText(expectedProductTitlesHighToLow);

    await catalogPage.sortByPrice("default");
    await expect(catalogPage.productTitles).toHaveText(expectedDefaultProductTitles);
  });

  test("combines search, category filtering, and sorting, then clears all filters", async () => {
    const expectedDefaultProductTitles = CATALOG_PRODUCTS.map((product) => product.title);
    const expectedFilteredProductTitles = ["Gaming Mouse", "Wireless Mouse"];

    await catalogPage.searchFor("mouse");
    await catalogPage.filterByCategory("Electronics");
    await catalogPage.sortByPrice("price-desc");

    await expect(catalogPage.searchInput).toHaveValue("mouse");
    await expect(catalogPage.categorySelect).toHaveValue("Electronics");
    await expect(catalogPage.sortSelect).toHaveValue("price-desc");
    await expect(catalogPage.clearFiltersButton).toBeEnabled();
    await expect(catalogPage.clearSearchButton).toBeVisible();
    await expect(catalogPage.productTitles).toHaveText(expectedFilteredProductTitles);
    await expect(catalogPage.productsStatus).toHaveText(
      `${expectedFilteredProductTitles.length} products found.`,
    );

    await catalogPage.clearFiltersButton.click();

    await expect(catalogPage.searchInput).toHaveValue("");
    await expect(catalogPage.categorySelect).toHaveValue("");
    await expect(catalogPage.sortSelect).toHaveValue("default");
    await expect(catalogPage.clearFiltersButton).toBeDisabled();
    await expect(catalogPage.clearSearchButton).toHaveCount(0);
    await expect(catalogPage.productTitles).toHaveText(expectedDefaultProductTitles);
    await expect(catalogPage.productsStatus).toHaveText(
      `${expectedDefaultProductTitles.length} products found.`,
    );
  });
});

test.describe("empty product catalog", () => {
  let catalogPage: ProductCatalogPage;

  test.beforeEach(async ({ page }) => {
    await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);
    await prepareProductCatalog(page, EMPTY_CATALOG_PRODUCTS);

    catalogPage = new ProductCatalogPage(page);
    await catalogPage.open();

    await expect(
      catalogPage.header.currentUserName,
      "Regular user session should be restored",
    ).toHaveText(REGULAR_USER.user.name);
  });

  test("shows the empty-catalog state when no products are available", async () => {
    await expect(catalogPage.emptyCatalogTitle).toBeVisible();
    await expect(catalogPage.emptyCatalogDescription).toBeVisible();

    await expect(catalogPage.searchInput).toHaveCount(0);
    await expect(catalogPage.productList).toHaveCount(0);
    await expect(catalogPage.noResultsTitle).toHaveCount(0);
    await expect(catalogPage.loadingStatus).toHaveCount(0);
    await expect(catalogPage.errorAlert).toHaveCount(0);
  });
});
