import { expect, test } from "../../src/fixtures";
import { ProductCatalogPage } from "../../src/pages";
import { authenticateUser, prepareProductCatalog } from "../../src/helpers";
import {
  REGULAR_USER,
  CATALOG_PRODUCTS,
  EMPTY_CATALOG_PRODUCTS,
  QUANTITY_PRODUCTS,
  QUANTITY_PRODUCT,
  OUT_OF_STOCK_PRODUCT,
  createProduct,
} from "../../src/test-data";

test.describe("product catalog", () => {
  let catalogPage: ProductCatalogPage;

  test.beforeEach(async ({ page }) => {
    await authenticateUser(page, REGULAR_USER);

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
    await authenticateUser(page, REGULAR_USER);

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
    await expect(catalogPage.productCards).toHaveCount(0);
  });
});

test.describe("product quantity", () => {
  let catalogPage: ProductCatalogPage;

  test.beforeEach(async ({ page }) => {
    await authenticateUser(page, REGULAR_USER);

    const products = QUANTITY_PRODUCTS.map((product) => createProduct(product));
    await prepareProductCatalog(page, products);

    catalogPage = new ProductCatalogPage(page);
    await catalogPage.open();

    await expect(
      catalogPage.header.currentUserName,
      "Regular user session should be restored",
    ).toHaveText(REGULAR_USER.user.name);
  });

  test("changes quantity with increment and decrement buttons", async () => {
    const productCard = catalogPage.getProductCard(QUANTITY_PRODUCT.title);

    await expect(productCard.title).toBeVisible();
    await expect(productCard.addToCart.quantityInput).toHaveValue("1");
    await expect(productCard.addToCart.decreaseButton).toBeDisabled();

    await productCard.addToCart.increaseQuantity();
    await expect(productCard.addToCart.quantityInput).toHaveValue("2");

    await productCard.addToCart.decreaseQuantity();
    await expect(productCard.addToCart.quantityInput).toHaveValue("1");

    await productCard.addToCart.increaseQuantity(QUANTITY_PRODUCT.stock - 1);
    await expect(productCard.addToCart.quantityInput).toHaveValue(
      String(QUANTITY_PRODUCT.stock),
    );
    await expect(productCard.addToCart.increaseButton).toBeDisabled();
  });

  test("changes quantity with ArrowUp and ArrowDown keys", async () => {
    const productCard = catalogPage.getProductCard(QUANTITY_PRODUCT.title);

    await expect(productCard.addToCart.quantityInput).toHaveValue("1");

    await productCard.addToCart.pressQuantityKey("ArrowDown");
    await expect(productCard.addToCart.quantityInput).toHaveValue("1");

    await productCard.addToCart.pressQuantityKey("ArrowUp");
    await expect(productCard.addToCart.quantityInput).toHaveValue("2");

    await productCard.addToCart.pressQuantityKey("ArrowDown");
    await expect(productCard.addToCart.quantityInput).toHaveValue("1");

    await productCard.addToCart.pressQuantityKey(
      "ArrowUp",
      QUANTITY_PRODUCT.stock - 1,
    );
    await expect(productCard.addToCart.quantityInput).toHaveValue(
      String(QUANTITY_PRODUCT.stock),
    );

    await productCard.addToCart.pressQuantityKey("ArrowUp");
    await expect(productCard.addToCart.quantityInput).toHaveValue(
      String(QUANTITY_PRODUCT.stock),
    );
  });

  test("accepts a valid manually entered quantity", async () => {
    const productCard = catalogPage.getProductCard(QUANTITY_PRODUCT.title);

    await expect(productCard.addToCart.quantityInput).toHaveValue("1");

    await productCard.addToCart.fillQuantity(
      String(QUANTITY_PRODUCT.stock - 1),
    );
    await expect(productCard.addToCart.quantityInput).toHaveValue(
      String(QUANTITY_PRODUCT.stock - 1),
    );
    await expect(productCard.addToCart.quantityError).toBeHidden();
    await expect(productCard.addToCart.addToCartButton).toBeEnabled();

    await productCard.addToCart.fillQuantity(String(QUANTITY_PRODUCT.stock));
    await expect(productCard.addToCart.quantityInput).toHaveValue(
      String(QUANTITY_PRODUCT.stock),
    );
    await expect(productCard.addToCart.quantityError).toBeHidden();
    await expect(productCard.addToCart.addToCartButton).toBeEnabled();
  });

  test("validates and recovers out-of-range manual quantities", async () => {
    const productCard = catalogPage.getProductCard(QUANTITY_PRODUCT.title);
    const excessiveQuantity = QUANTITY_PRODUCT.stock + 10;

    await expect(productCard.addToCart.quantityInput).toHaveValue("1");

    await test.step("recover from a quantity below the minimum", async () => {
      await productCard.addToCart.fillQuantity("0");

      await expect(productCard.addToCart.quantityInput).toHaveValue("0");
      await expect(productCard.addToCart.quantityError).toBeVisible();
      await expect(productCard.addToCart.quantityError).toHaveText(
        "Quantity must be at least 1.",
      );
      await expect(productCard.addToCart.quantityError).toHaveRole("alert");
      await expect(productCard.addToCart.quantityInput).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      await expect(productCard.addToCart.decreaseButton).toBeDisabled();
      await expect(productCard.addToCart.increaseButton).toBeEnabled();
      await expect(productCard.addToCart.addToCartButton).toBeDisabled();

      await productCard.addToCart.increaseQuantity();

      await expect(productCard.addToCart.quantityInput).toHaveValue("1");
      await expect(productCard.addToCart.quantityError).toBeHidden();
      await expect(productCard.addToCart.quantityInput).toHaveAttribute(
        "aria-invalid",
        "false",
      );
      await expect(productCard.addToCart.decreaseButton).toBeDisabled();
      await expect(productCard.addToCart.increaseButton).toBeEnabled();
      await expect(productCard.addToCart.addToCartButton).toBeEnabled();
    });

    await test.step("recover from a quantity above available stock", async () => {
      await productCard.addToCart.fillQuantity(String(excessiveQuantity));

      await expect(productCard.addToCart.quantityInput).toHaveValue(
        String(excessiveQuantity),
      );
      await expect(productCard.addToCart.quantityError).toBeVisible();
      await expect(productCard.addToCart.quantityError).toHaveText(
        `Only ${QUANTITY_PRODUCT.stock} items are available to add.`,
      );
      await expect(productCard.addToCart.quantityError).toHaveRole("alert");
      await expect(productCard.addToCart.quantityInput).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      await expect(productCard.addToCart.decreaseButton).toBeEnabled();
      await expect(productCard.addToCart.increaseButton).toBeDisabled();
      await expect(productCard.addToCart.addToCartButton).toBeDisabled();

      await productCard.addToCart.decreaseQuantity();

      await expect(productCard.addToCart.quantityInput).toHaveValue(
        String(QUANTITY_PRODUCT.stock),
      );
      await expect(productCard.addToCart.quantityError).toBeHidden();
      await expect(productCard.addToCart.quantityInput).toHaveAttribute(
        "aria-invalid",
        "false",
      );
      await expect(productCard.addToCart.decreaseButton).toBeEnabled();
      await expect(productCard.addToCart.increaseButton).toBeDisabled();
      await expect(productCard.addToCart.addToCartButton).toBeEnabled();
    });
  });

  test("prevents purchasing an out-of-stock product", async () => {
    const productCard = catalogPage.getProductCard(OUT_OF_STOCK_PRODUCT.title);

    await expect(productCard.addToCart.quantityInput).toBeDisabled();
    await expect(productCard.addToCart.decreaseButton).toBeDisabled();
    await expect(productCard.addToCart.increaseButton).toBeDisabled();
    await expect(productCard.addToCart.addToCartButton).toBeDisabled();

    await expect(productCard.addToCart.productAvailability).toContainText(
      "No more items available",
    );
    await expect(productCard.addToCart.quantityHint).toHaveText(
      "This product cannot be added right now.",
    );

    await expect(productCard.addToCart.quantityInput).toHaveAttribute(
      "aria-invalid",
      "false",
    );
    await expect(productCard.addToCart.quantityError).toBeHidden();
  });

  test("handles pasted quantity values", async ({ browserName, context }) => {
    // Chromium-only: this scenario requires browser clipboard permissions.
    test.skip(
      browserName !== "chromium",
      "Clipboard-based paste is supported only in the Chromium project.",
    );

    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    const productCard = catalogPage.getProductCard(QUANTITY_PRODUCT.title);

    await productCard.addToCart.pasteQuantity("3");
    await expect(productCard.addToCart.quantityInput).toHaveValue("3");

    await productCard.addToCart.pasteQuantity("-4");
    await expect(productCard.addToCart.quantityInput).toHaveValue("3");

    await productCard.addToCart.pasteQuantity("1.5");
    await expect(productCard.addToCart.quantityInput).toHaveValue("3");
  });
});
