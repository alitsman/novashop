import { apiUrl } from "../../src/config/playwright.shared";
import { expect, test } from "../../src/fixtures";
import {
  holdProductCatalogUntilReleased,
  prepareMockedAuthenticatedSession,
  prepareProductCatalog,
  prepareProductCatalogNetworkFailure,
  prepareProductDetails,
} from "../../src/helpers";
import { AdminProductsPage, ProductCatalogPage } from "../../src/pages";
import {
  ADMIN_LIST_MIDDLE_PRODUCT,
  ADMIN_LIST_NEWEST_PRODUCT,
  ADMIN_LIST_OLDEST_PRODUCT,
  ADMIN_USER,
  createProduct,
} from "../../src/test-data";

const PRODUCTS_API_URL = new URL("/products", apiUrl).toString();

test.describe("admin products", () => {
  test("admin can open product management from the header", async ({ page }) => {
    await prepareMockedAuthenticatedSession(page, ADMIN_USER.user);
    await prepareProductCatalog(page, []);

    const catalogPage = new ProductCatalogPage(page);
    const adminProductsPage = new AdminProductsPage(page);

    await catalogPage.open();

    await expect(catalogPage.header.manageProducts).toBeVisible();

    await catalogPage.header.manageProducts.click();

    await expect(page).toHaveURL("/admin/products");
    await expect(adminProductsPage.heading).toBeVisible();
  });

  test("shows loading state until admin products are loaded", async ({ page }) => {
    await prepareMockedAuthenticatedSession(page, ADMIN_USER.user);

    const product = createProduct(ADMIN_LIST_NEWEST_PRODUCT);

    const heldProductsRequest = await holdProductCatalogUntilReleased(page, [product]);

    const adminProductsPage = new AdminProductsPage(page);

    try {
      await Promise.all([adminProductsPage.open(), heldProductsRequest.requestObserved]);

      await expect(adminProductsPage.heading).toBeVisible();
      await expect(adminProductsPage.loadingStatus).toBeVisible();
      await expect(adminProductsPage.errorAlert).toHaveCount(0);
      await expect(adminProductsPage.emptyStateTitle).toHaveCount(0);
      await expect(adminProductsPage.table).toHaveCount(0);

      heldProductsRequest.release();

      await expect(adminProductsPage.table).toBeVisible();
      await expect(adminProductsPage.getProductRow(product.title)).toBeVisible();
      await expect(adminProductsPage.loadingStatus).toHaveCount(0);
    } finally {
      await heldProductsRequest.dispose();
    }
  });

  test("shows empty state when no products are available", async ({ page }) => {
    await prepareMockedAuthenticatedSession(page, ADMIN_USER.user);
    await prepareProductCatalog(page, []);

    const adminProductsPage = new AdminProductsPage(page);

    const productsResponsePromise = page.waitForResponse(
      (response) => response.url() === PRODUCTS_API_URL && response.request().method() === "GET",
    );

    // Wait for the mocked catalog response so assertions describe the post-response UI.
    await Promise.all([adminProductsPage.open(), productsResponsePromise]);

    await expect(adminProductsPage.emptyStateTitle).toBeVisible();
    await expect(adminProductsPage.emptyStateDescription).toBeVisible();
    await expect(adminProductsPage.emptyStateCreateProductLink).toBeVisible();

    await expect(adminProductsPage.loadingStatus).toHaveCount(0);
    await expect(adminProductsPage.errorAlert).toHaveCount(0);
    await expect(adminProductsPage.table).toHaveCount(0);

    await adminProductsPage.emptyStateCreateProductLink.click();

    await expect(page).toHaveURL("/admin/products/new");
  });

  test("retries loading products after a network failure", async ({ page }) => {
    await prepareMockedAuthenticatedSession(page, ADMIN_USER.user);
    await prepareProductCatalogNetworkFailure(page);

    const product = createProduct(ADMIN_LIST_NEWEST_PRODUCT);

    const adminProductsPage = new AdminProductsPage(page);

    await adminProductsPage.open();

    await expect(adminProductsPage.errorAlert).toBeVisible();
    await expect(adminProductsPage.errorAlert).toContainText("Unable to connect to the server.");
    await expect(adminProductsPage.retryButton).toBeVisible();
    await expect(adminProductsPage.loadingStatus).toHaveCount(0);
    await expect(adminProductsPage.emptyStateTitle).toHaveCount(0);
    await expect(adminProductsPage.table).toHaveCount(0);

    // Replace the failed catalog response before the user retries.
    await page.unroute(PRODUCTS_API_URL);
    await prepareProductCatalog(page, [product]);

    const productsResponsePromise = page.waitForResponse(
      (response) => response.url() === PRODUCTS_API_URL && response.request().method() === "GET",
    );

    await Promise.all([adminProductsPage.retryButton.click(), productsResponsePromise]);

    await expect(adminProductsPage.table).toBeVisible();
    await expect(adminProductsPage.getProductRow(product.title)).toBeVisible();

    await expect(adminProductsPage.errorAlert).toHaveCount(0);
    await expect(adminProductsPage.retryButton).toHaveCount(0);
    await expect(adminProductsPage.loadingStatus).toHaveCount(0);
    await expect(adminProductsPage.emptyStateTitle).toHaveCount(0);
  });

  test("shows products newest first with complete row details and navigation", async ({ page }) => {
    await prepareMockedAuthenticatedSession(page, ADMIN_USER.user);

    const oldestProduct = createProduct(ADMIN_LIST_OLDEST_PRODUCT);
    const middleProduct = createProduct(ADMIN_LIST_MIDDLE_PRODUCT);
    const newestProduct = createProduct(ADMIN_LIST_NEWEST_PRODUCT);

    // The response is deliberately out of chronological order so the test proves frontend sorting.
    await prepareProductCatalog(page, [middleProduct, oldestProduct, newestProduct]);

    const adminProductsPage = new AdminProductsPage(page);

    const productsResponsePromise = page.waitForResponse(
      (response) => response.url() === PRODUCTS_API_URL && response.request().method() === "GET",
    );

    await Promise.all([adminProductsPage.open(), productsResponsePromise]);

    await expect(adminProductsPage.table).toBeVisible();

    await expect(adminProductsPage.columnHeaders).toHaveText([
      "Product",
      "Category",
      "Price",
      "Stock",
      "Actions",
    ]);

    await expect(adminProductsPage.editLinks).toHaveCount(3);

    // Position is part of the product behavior: newest products must appear first.
    await expect(adminProductsPage.editLinks.nth(0)).toHaveAccessibleName(
      `Edit ${newestProduct.title}`,
    );
    await expect(adminProductsPage.editLinks.nth(1)).toHaveAccessibleName(
      `Edit ${middleProduct.title}`,
    );
    await expect(adminProductsPage.editLinks.nth(2)).toHaveAccessibleName(
      `Edit ${oldestProduct.title}`,
    );

    const newestProductRowHeader = adminProductsPage.getProductRowHeader(newestProduct.title);

    await expect(
      newestProductRowHeader.getByText(newestProduct.title, {
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      newestProductRowHeader.getByText(
        "An adjustable stand used for admin product list coverage.",
        {
          exact: true,
        },
      ),
    ).toBeVisible();

    await expect(adminProductsPage.getProductCategoryCell(newestProduct.title)).toHaveText(
      "Workspace",
    );

    await expect(adminProductsPage.getProductPriceCell(newestProduct.title)).toHaveText("$84.75");

    await expect(adminProductsPage.getProductStockCell(newestProduct.title)).toHaveText("7");

    const newestProductImage = adminProductsPage.getProductImage(newestProduct.title);

    await expect(newestProductImage).toHaveAttribute(
      "src",
      "https://example.com/admin-monitor-stand.jpg",
    );
    await expect(newestProductImage).toHaveAttribute("alt", "");

    await expect(adminProductsPage.createProductLink).toHaveAttribute(
      "href",
      "/admin/products/new",
    );

    await prepareProductDetails(page, newestProduct);

    await adminProductsPage.getEditProductLink(newestProduct.title).click();

    await expect(page).toHaveURL(`/admin/products/${newestProduct.id}/edit`);
  });
});
