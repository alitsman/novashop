import { test, expect } from "@playwright/test";
import { ProductCatalogPage } from "../../src/pages/product-catalog.page";
import { authenticateAsRegularUser } from "../../src/helpers/auth.helper";
import { prepareProductCatalog } from "../../src/helpers/product-catalog.helper";
import {
  CATALOG_PRODUCTS,
  EMPTY_CATALOG_PRODUCTS,
  QUANTITY_PRODUCTS,
  QUANTITY_PRODUCT,
  OUT_OF_STOCK_PRODUCT,
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

test.describe("product quantity", () => {
  let catalogPage: ProductCatalogPage;

  test.beforeEach(async ({ page }) => {
    await authenticateAsRegularUser(page);

    const products = QUANTITY_PRODUCTS.map((product) => createProduct(product));
    await prepareProductCatalog(page, products);

    catalogPage = new ProductCatalogPage(page);
    await catalogPage.open();

    await expect(
      catalogPage.header.currentUserName,
      "Regular user session should be restored",
    ).toHaveText("Regular User");
  });

  test("changes quantity with increment and decrement buttons", async () => {
    const productCard = catalogPage.getProductCard(QUANTITY_PRODUCT.title);

    await expect(productCard.title).toBeVisible();
    await expect(productCard.quantityInput).toHaveValue("1");
    await expect(productCard.decreaseButton).toBeDisabled();

    await productCard.increaseQuantity();
    await expect(productCard.quantityInput).toHaveValue("2");

    await productCard.decreaseQuantity();
    await expect(productCard.quantityInput).toHaveValue("1");

    await productCard.increaseQuantity(QUANTITY_PRODUCT.stock - 1);
    await expect(productCard.quantityInput).toHaveValue(
      String(QUANTITY_PRODUCT.stock),
    );
    await expect(productCard.increaseButton).toBeDisabled();
  });

  test("changes quantity with ArrowUp and ArrowDown keys", async () => {
    const productCard = catalogPage.getProductCard(QUANTITY_PRODUCT.title);

    await expect(productCard.quantityInput).toHaveValue("1");

    await productCard.pressQuantityKey("ArrowDown");
    await expect(productCard.quantityInput).toHaveValue("1");

    await productCard.pressQuantityKey("ArrowUp");
    await expect(productCard.quantityInput).toHaveValue("2");

    await productCard.pressQuantityKey("ArrowDown");
    await expect(productCard.quantityInput).toHaveValue("1");

    await productCard.pressQuantityKey("ArrowUp", QUANTITY_PRODUCT.stock - 1);
    await expect(productCard.quantityInput).toHaveValue(
      String(QUANTITY_PRODUCT.stock),
    );

    await productCard.pressQuantityKey("ArrowUp");
    await expect(productCard.quantityInput).toHaveValue(
      String(QUANTITY_PRODUCT.stock),
    );
  });

  test("accepts a valid manually entered quantity", async () => {
    const productCard = catalogPage.getProductCard(QUANTITY_PRODUCT.title);

    await expect(productCard.quantityInput).toHaveValue("1");

    await productCard.fillQuantity(String(QUANTITY_PRODUCT.stock - 1));
    await expect(productCard.quantityInput).toHaveValue(
      String(QUANTITY_PRODUCT.stock - 1),
    );
    await expect(productCard.quantityError).toBeHidden();
    await expect(productCard.addToCartButton).toBeEnabled();

    await productCard.fillQuantity(String(QUANTITY_PRODUCT.stock));
    await expect(productCard.quantityInput).toHaveValue(
      String(QUANTITY_PRODUCT.stock),
    );
    await expect(productCard.quantityError).toBeHidden();
    await expect(productCard.addToCartButton).toBeEnabled();
  });

  test("validates and recovers out-of-range manual quantities", async () => {
    const productCard = catalogPage.getProductCard(QUANTITY_PRODUCT.title);
    const excessiveQuantity = QUANTITY_PRODUCT.stock + 10;

    await expect(productCard.quantityInput).toHaveValue("1");

    await test.step("recover from a quantity below the minimum", async () => {
      await productCard.fillQuantity("0");

      await expect(productCard.quantityInput).toHaveValue("0");
      await expect(productCard.quantityError).toBeVisible();
      await expect(productCard.quantityError).toHaveText(
        "Quantity must be at least 1.",
      );
      await expect(productCard.quantityError).toHaveRole("alert");
      await expect(productCard.quantityInput).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      await expect(productCard.decreaseButton).toBeDisabled();
      await expect(productCard.increaseButton).toBeEnabled();
      await expect(productCard.addToCartButton).toBeDisabled();

      await productCard.increaseQuantity();

      await expect(productCard.quantityInput).toHaveValue("1");
      await expect(productCard.quantityError).toBeHidden();
      await expect(productCard.quantityInput).toHaveAttribute(
        "aria-invalid",
        "false",
      );
      await expect(productCard.decreaseButton).toBeDisabled();
      await expect(productCard.increaseButton).toBeEnabled();
      await expect(productCard.addToCartButton).toBeEnabled();
    });

    await test.step("recover from a quantity above available stock", async () => {
      await productCard.fillQuantity(String(excessiveQuantity));

      await expect(productCard.quantityInput).toHaveValue(
        String(excessiveQuantity),
      );
      await expect(productCard.quantityError).toBeVisible();
      await expect(productCard.quantityError).toHaveText(
        `Only ${QUANTITY_PRODUCT.stock} items are available to add.`,
      );
      await expect(productCard.quantityError).toHaveRole("alert");
      await expect(productCard.quantityInput).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      await expect(productCard.decreaseButton).toBeEnabled();
      await expect(productCard.increaseButton).toBeDisabled();
      await expect(productCard.addToCartButton).toBeDisabled();

      await productCard.decreaseQuantity();

      await expect(productCard.quantityInput).toHaveValue(
        String(QUANTITY_PRODUCT.stock),
      );
      await expect(productCard.quantityError).toBeHidden();
      await expect(productCard.quantityInput).toHaveAttribute(
        "aria-invalid",
        "false",
      );
      await expect(productCard.decreaseButton).toBeEnabled();
      await expect(productCard.increaseButton).toBeDisabled();
      await expect(productCard.addToCartButton).toBeEnabled();
    });
  });

  test("prevents purchasing an out-of-stock product", async () => {
    const productCard = catalogPage.getProductCard(OUT_OF_STOCK_PRODUCT.title);

    await expect(productCard.quantityInput).toBeDisabled();
    await expect(productCard.decreaseButton).toBeDisabled();
    await expect(productCard.increaseButton).toBeDisabled();
    await expect(productCard.addToCartButton).toBeDisabled();

    await expect(productCard.availability).toContainText(
      "No more items available",
    );
    await expect(productCard.quantityHint).toHaveText(
      "This product cannot be added right now.",
    );

    await expect(productCard.quantityInput).toHaveAttribute(
      "aria-invalid",
      "false",
    );
    await expect(productCard.quantityError).toBeHidden();
  });

  test("handles pasted quantity values", async ({ browserName, context }) => {
    // Chromium-only: this scenario requires browser clipboard permissions.
    test.skip(
      browserName !== "chromium",
      "Clipboard-based paste is supported only in the Chromium project.",
    );

    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    const productCard = catalogPage.getProductCard(QUANTITY_PRODUCT.title);

    await productCard.pasteQuantity("3");
    await expect(productCard.quantityInput).toHaveValue("3");

    await productCard.pasteQuantity("-4");
    await expect(productCard.quantityInput).toHaveValue("3");

    await productCard.pasteQuantity("1.5");
    await expect(productCard.quantityInput).toHaveValue("3");
  });
});

// test.describe("add to cart from catalog", () => {
//   // This suite verifies that the quantity selected in the product catalog
//   // is correctly transferred to the corresponding cart item.

//   // Use a dedicated product with stock greater than the selected quantity.
//   // Start each test with an authenticated regular user and an empty cart.
//   // Prepare the catalog with only the product required by this scenario.
//   // Initialize ProductCatalogPage and the future CartPage.
//   // Open the product catalog.

//   test("transfers the selected quantity to the cart", async () => {
//     // Find the product card by its exact accessible name.
//     // Enter a valid quantity using the shortest available interaction.
//     // Verify that the quantity input contains the selected value.
//     // Add the product to the cart.
//     // Open the cart through HeaderComponent instead of direct navigation.
//     // Find the cart item by its exact product title.
//     // Verify that the cart contains exactly one item entry.
//     // Verify that the expected product was added.
//     // Verify that the selected quantity was transferred to the cart.
//   });
// });
