import { ToastComponent } from "../../src/components";
import { apiUrl } from "../../src/config/playwright.shared";
import { expect, test } from "../../src/fixtures";
import {
  holdRequestUntilReleased,
  prepareMockedAuthenticatedSession,
  prepareProductCatalog,
} from "../../src/helpers";
import { AdminProductsPage } from "../../src/pages";
import { apiErrorResponseSchema } from "../../src/schemas";
import {
  ADMIN_LIST_MIDDLE_PRODUCT,
  ADMIN_LIST_NEWEST_PRODUCT,
  ADMIN_USER,
  createProduct,
} from "../../src/test-data";

const TARGET_PRODUCT = createProduct(ADMIN_LIST_NEWEST_PRODUCT);
const OTHER_PRODUCT = createProduct(ADMIN_LIST_MIDDLE_PRODUCT);

const PRODUCTS_API_RESOURCE_URL = new URL("/products/", apiUrl).toString();

const DELETE_FAILURE_RESPONSE = apiErrorResponseSchema.parse({
  error: {
    code: "INTERNAL_SERVER_ERROR",
    message: "Controlled product deletion failure.",
  },
});

const buildProductApiUrl = (productId: string): string => {
  return new URL(`/products/${encodeURIComponent(productId)}`, apiUrl).toString();
};

test.describe("admin product delete", () => {
  let adminProductsPage: AdminProductsPage;
  let toast: ToastComponent;

  test.beforeEach(async ({ page }) => {
    await prepareMockedAuthenticatedSession(page, ADMIN_USER.user);
    await prepareProductCatalog(page, [OTHER_PRODUCT, TARGET_PRODUCT]);

    adminProductsPage = new AdminProductsPage(page);
    toast = new ToastComponent(page);

    await adminProductsPage.open();

    await expect(adminProductsPage.getProductRow(TARGET_PRODUCT.title)).toBeVisible();
    await expect(adminProductsPage.getProductRow(OTHER_PRODUCT.title)).toBeVisible();
  });

  test("opens confirmation for the selected product and cancels without deleting", async ({
    page,
  }) => {
    let deleteRequestCount = 0;

    page.on("request", (request) => {
      if (request.method() === "DELETE" && request.url().startsWith(PRODUCTS_API_RESOURCE_URL)) {
        deleteRequestCount += 1;
      }
    });

    await adminProductsPage.getDeleteProductButton(TARGET_PRODUCT.title).click();

    await expect(adminProductsPage.deleteDialog.root).toBeVisible();
    await expect(adminProductsPage.deleteDialog.root).toHaveAccessibleDescription(
      `Are you sure you want to delete "${TARGET_PRODUCT.title}"? This action cannot be undone.`,
    );
    await expect(adminProductsPage.deleteDialog.root).not.toContainText(OTHER_PRODUCT.title);

    await adminProductsPage.deleteDialog.cancel();

    await expect(adminProductsPage.deleteDialog.root).toHaveCount(0);

    await expect(adminProductsPage.getProductRow(TARGET_PRODUCT.title)).toBeVisible();
    await expect(adminProductsPage.getProductRow(OTHER_PRODUCT.title)).toBeVisible();

    await expect(toast.closeButton).toHaveCount(0);

    expect(deleteRequestCount).toBe(0);
  });

  test("blocks duplicate deletion and allows recovery after failure", async ({ page }) => {
    const deleteProductApiUrl = buildProductApiUrl(TARGET_PRODUCT.id);

    let deleteRequestCount = 0;

    page.on("request", (request) => {
      if (request.url() === deleteProductApiUrl && request.method() === "DELETE") {
        deleteRequestCount += 1;
      }
    });

    const heldDeleteRequest = await holdRequestUntilReleased(page, {
      url: deleteProductApiUrl,
      method: "DELETE",
      fulfillWith: {
        status: 500,
        json: DELETE_FAILURE_RESPONSE,
      },
    });

    try {
      await adminProductsPage.getDeleteProductButton(TARGET_PRODUCT.title).click();

      await expect(adminProductsPage.deleteDialog.root).toBeVisible();

      await Promise.all([
        adminProductsPage.deleteDialog.confirm(),
        heldDeleteRequest.requestObserved,
      ]);

      const targetDeleteButton = adminProductsPage.getDeleteProductButton(TARGET_PRODUCT.title);

      await expect(targetDeleteButton).toHaveText("Deleting...");
      await expect(targetDeleteButton).toBeDisabled();
      await expect(targetDeleteButton).toHaveAttribute("aria-busy", "true");

      await expect(adminProductsPage.deleteDialog.root).toBeVisible();

      await adminProductsPage.deleteDialog.confirm();

      heldDeleteRequest.release();

      await expect(adminProductsPage.deleteError).toHaveText(DELETE_FAILURE_RESPONSE.error.message);

      expect(deleteRequestCount).toBe(1);

      await expect(adminProductsPage.deleteDialog.root).toHaveCount(0);

      await expect(adminProductsPage.getProductRow(TARGET_PRODUCT.title)).toBeVisible();
      await expect(adminProductsPage.getProductRow(OTHER_PRODUCT.title)).toBeVisible();

      await expect(toast.closeButton).toHaveCount(0);

      await targetDeleteButton.click();

      await expect(adminProductsPage.deleteDialog.root).toBeVisible();
      await expect(adminProductsPage.deleteError).toHaveCount(0);

      await adminProductsPage.deleteDialog.cancel();

      await expect(adminProductsPage.deleteDialog.root).toHaveCount(0);
    } finally {
      await heldDeleteRequest.dispose();
    }
  });
});
