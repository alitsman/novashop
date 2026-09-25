import { randomUUID } from "node:crypto";

import type { APIRequestContext } from "@playwright/test";

import { ToastComponent } from "../../src/components";
import { apiUrl } from "../../src/config/playwright.shared";
import { expect, test } from "../../src/fixtures";
import { createProductViaApi, loginViaApi, seedAuthTokenForEachPageLoad } from "../../src/helpers";
import {
  AdminProductCreatePage,
  AdminProductEditPage,
  AdminProductsPage,
  ProductCatalogPage,
} from "../../src/pages";
import { productSchema } from "../../src/schemas";
import {
  ADMIN_PRODUCT_VALID_INPUT,
  ADMIN_USER,
  SEEDED_REFERENCE_PRODUCT,
} from "../../src/test-data";
import { formatUsd } from "../../src/utils";

const PRODUCTS_API_URL = new URL("/products", apiUrl).toString();

async function cleanupProduct(
  backendRequest: APIRequestContext,
  adminToken: string,
  productId: string | undefined,
  expectedStatuses: readonly number[],
): Promise<void> {
  if (productId === undefined) {
    return;
  }

  const cleanupResponse = await backendRequest.delete(`/products/${productId}`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  expect(
    expectedStatuses,
    `Cleanup failed for product ${productId}: received status ${cleanupResponse.status()}`,
  ).toContain(cleanupResponse.status());
}

test.describe("admin product mutations", () => {
  let adminToken: string;

  test.beforeEach(async ({ page, backendRequest }) => {
    adminToken = await loginViaApi(backendRequest, ADMIN_USER);

    await seedAuthTokenForEachPageLoad(page, adminToken);
  });

  test("creates a product and shows it in the customer catalog", async ({
    page,
    backendRequest,
  }) => {
    const productInput = {
      ...ADMIN_PRODUCT_VALID_INPUT,
      title: `E2E Admin Create Product ${randomUUID()}`,
    };

    const adminProductCreatePage = new AdminProductCreatePage(page);
    const adminProductsPage = new AdminProductsPage(page);
    const catalogPage = new ProductCatalogPage(page);
    const toast = new ToastComponent(page);

    let createdProductId: string | undefined;

    try {
      await adminProductCreatePage.open();

      await expect(page).toHaveURL("/admin/products/new");
      await expect(adminProductCreatePage.heading).toBeVisible();

      await adminProductCreatePage.form.titleInput.fill(productInput.title);
      await adminProductCreatePage.form.priceInput.fill(String(productInput.price));
      await adminProductCreatePage.form.stockInput.fill(String(productInput.stock));
      await adminProductCreatePage.form.categoryInput.fill(productInput.category);
      await adminProductCreatePage.form.imageUrlInput.fill(productInput.imageUrl);
      await adminProductCreatePage.form.descriptionInput.fill(productInput.description);

      const createResponsePromise = page.waitForResponse(
        (response) => response.url() === PRODUCTS_API_URL && response.request().method() === "POST",
      );

      await adminProductCreatePage.form.submitButton.click();

      const createResponse = await createResponsePromise;

      expect(createResponse.status()).toBe(201);

      const createdProduct = productSchema.parse(await createResponse.json());

      createdProductId = createdProduct.id;

      await expect(page).toHaveURL("/admin/products");
      await expect(adminProductsPage.heading).toBeVisible();
      await expect(toast.message).toHaveText("Product created successfully.");
      await expect(adminProductsPage.getProductRow(productInput.title)).toBeVisible();

      await catalogPage.open();

      await expect(page).toHaveURL("/products");
      await expect(catalogPage.heading).toBeVisible();

      const catalogProduct = catalogPage.getProductCard(productInput.title);

      await expect(catalogProduct.title).toHaveText(productInput.title);
      await expect(catalogProduct.price).toHaveText(formatUsd(productInput.price));
      await expect(catalogProduct.addToCart.available).toHaveText(
        `Available: ${productInput.stock}`,
      );
    } finally {
      await cleanupProduct(backendRequest, adminToken, createdProductId, [204]);
    }
  });

  test("updates a product and shows the changes in the customer catalog", async ({
    page,
    backendRequest,
  }) => {
    const originalTitle = `E2E Admin Update Product ${randomUUID()}`;
    const updatedTitle = `E2E Admin Updated Product ${randomUUID()}`;
    const updatedPrice = 129.5;
    const updatedStock = 11;

    const adminProductEditPage = new AdminProductEditPage(page);
    const adminProductsPage = new AdminProductsPage(page);
    const catalogPage = new ProductCatalogPage(page);
    const toast = new ToastComponent(page);

    let createdProductId: string | undefined;

    try {
      const testProduct = await createProductViaApi(backendRequest, adminToken, {
        ...ADMIN_PRODUCT_VALID_INPUT,
        title: originalTitle,
      });

      createdProductId = testProduct.id;

      const updateProductApiUrl = new URL(`/products/${testProduct.id}`, apiUrl).toString();

      await adminProductEditPage.open(testProduct.id);

      await expect(page).toHaveURL(`/admin/products/${testProduct.id}/edit`);
      await expect(adminProductEditPage.form.titleInput).toHaveValue(originalTitle);

      await adminProductEditPage.form.titleInput.fill(updatedTitle);
      await adminProductEditPage.form.priceInput.fill(String(updatedPrice));
      await adminProductEditPage.form.stockInput.fill(String(updatedStock));

      const updateResponsePromise = page.waitForResponse(
        (response) =>
          response.url() === updateProductApiUrl && response.request().method() === "PATCH",
      );

      await adminProductEditPage.form.submitButton.click();

      const updateResponse = await updateResponsePromise;

      expect(updateResponse.status()).toBe(200);

      await expect(page).toHaveURL("/admin/products");
      await expect(adminProductsPage.heading).toBeVisible();
      await expect(toast.message).toHaveText("Product updated successfully.");

      await expect(adminProductsPage.getProductRow(updatedTitle)).toBeVisible();
      await expect(adminProductsPage.getProductPriceCell(updatedTitle)).toHaveText(
        formatUsd(updatedPrice),
      );
      await expect(adminProductsPage.getProductStockCell(updatedTitle)).toHaveText(
        String(updatedStock),
      );

      await catalogPage.open();

      await expect(page).toHaveURL("/products");
      await expect(catalogPage.heading).toBeVisible();

      const catalogProduct = catalogPage.getProductCard(updatedTitle);

      await expect(catalogProduct.title).toHaveText(updatedTitle);
      await expect(catalogProduct.price).toHaveText(formatUsd(updatedPrice));
      await expect(catalogProduct.addToCart.available).toHaveText(`Available: ${updatedStock}`);
    } finally {
      await cleanupProduct(backendRequest, adminToken, createdProductId, [204]);
    }
  });

  test("deletes a product and removes it from the customer catalog", async ({
    page,
    backendRequest,
  }) => {
    const productTitle = `E2E Admin Delete Product ${randomUUID()}`;

    const adminProductsPage = new AdminProductsPage(page);
    const catalogPage = new ProductCatalogPage(page);
    const toast = new ToastComponent(page);

    let createdProductId: string | undefined;

    try {
      const testProduct = await createProductViaApi(backendRequest, adminToken, {
        ...ADMIN_PRODUCT_VALID_INPUT,
        title: productTitle,
      });

      createdProductId = testProduct.id;

      const deleteProductApiUrl = new URL(`/products/${testProduct.id}`, apiUrl).toString();

      await adminProductsPage.open();

      await expect(page).toHaveURL("/admin/products");
      await expect(adminProductsPage.heading).toBeVisible();
      await expect(adminProductsPage.getProductRow(productTitle)).toBeVisible();

      await adminProductsPage.getDeleteProductButton(productTitle).click();

      await expect(adminProductsPage.deleteDialog.root).toBeVisible();
      await expect(adminProductsPage.deleteDialog.root).toHaveAccessibleDescription(
        `Are you sure you want to delete "${productTitle}"? This action cannot be undone.`,
      );

      const deleteResponsePromise = page.waitForResponse(
        (response) =>
          response.url() === deleteProductApiUrl && response.request().method() === "DELETE",
      );

      await adminProductsPage.deleteDialog.confirm();

      const deleteResponse = await deleteResponsePromise;

      expect(deleteResponse.status()).toBe(204);

      await expect(adminProductsPage.deleteDialog.root).toHaveCount(0);
      await expect(adminProductsPage.getProductRow(productTitle)).toHaveCount(0);
      await expect(toast.message).toHaveText(`Product "${productTitle}" deleted successfully.`);

      // Wait for the catalog to finish loading before checking absence:
      // an empty loading state also satisfies toHaveCount(0).
      const catalogResponsePromise = page.waitForResponse(
        (response) => response.url() === PRODUCTS_API_URL && response.request().method() === "GET",
      );

      await Promise.all([catalogPage.open(), catalogResponsePromise]);

      await expect(page).toHaveURL("/products");
      await expect(catalogPage.heading).toBeVisible();
      await expect(catalogPage.loadingStatus).toHaveCount(0);
      await expect(catalogPage.errorAlert).toHaveCount(0);

      // Confirm the loaded catalog contains known data before asserting the deleted product is absent.
      const referenceCatalogProduct = catalogPage.getProductCard(SEEDED_REFERENCE_PRODUCT.title);

      await expect(referenceCatalogProduct.title).toHaveText(SEEDED_REFERENCE_PRODUCT.title);

      const deletedCatalogProduct = catalogPage.getProductCard(productTitle);

      await expect(deletedCatalogProduct.title).toHaveCount(0);
    } finally {
      await cleanupProduct(backendRequest, adminToken, createdProductId, [204, 404]);
    }
  });
});
