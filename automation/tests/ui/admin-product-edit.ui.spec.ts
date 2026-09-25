import { ToastComponent } from "../../src/components";
import { apiUrl } from "../../src/config/playwright.shared";
import { expect, test } from "../../src/fixtures";
import {
  holdProductDetailsUntilReleased,
  holdRequestUntilReleased,
  prepareMockedAuthenticatedSession,
  prepareProductCatalog,
  prepareProductDetails,
  prepareProductDetailsNotFound,
  prepareProductDetailsServerFailure,
  prepareProductDetailsValidationFailure,
} from "../../src/helpers";
import { AdminProductEditPage, AdminProductsPage } from "../../src/pages";
import { apiErrorResponseSchema } from "../../src/schemas";
import { ADMIN_LIST_NEWEST_PRODUCT, ADMIN_USER, createProduct } from "../../src/test-data";

const EDIT_PRODUCT = createProduct(ADMIN_LIST_NEWEST_PRODUCT);

const MISSING_PRODUCT_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const INVALID_PRODUCT_ID = "not-a-uuid";

const UPDATE_FAILURE_RESPONSE = apiErrorResponseSchema.parse({
  error: {
    code: "INTERNAL_SERVER_ERROR",
    message: "Controlled product update failure.",
  },
});

const buildProductApiUrl = (productId: string): string => {
  return new URL(`/products/${encodeURIComponent(productId)}`, apiUrl).toString();
};

test.describe("admin product edit", () => {
  let adminProductEditPage: AdminProductEditPage;

  test.beforeEach(async ({ page }) => {
    await prepareMockedAuthenticatedSession(page, ADMIN_USER.user);

    adminProductEditPage = new AdminProductEditPage(page);
  });

  test("loads product details and prefills the edit form", async ({ page }) => {
    const heldProductDetailsRequest = await holdProductDetailsUntilReleased(page, EDIT_PRODUCT);

    try {
      await Promise.all([
        adminProductEditPage.open(EDIT_PRODUCT.id),
        heldProductDetailsRequest.requestObserved,
      ]);

      await expect(adminProductEditPage.heading).toBeVisible();
      await expect(adminProductEditPage.loadingStatus).toBeVisible();

      await expect(adminProductEditPage.form.titleInput).toHaveCount(0);
      await expect(adminProductEditPage.preview.productTitle).toHaveCount(0);
      await expect(adminProductEditPage.deleteSection).toHaveCount(0);

      heldProductDetailsRequest.release();
    } finally {
      await heldProductDetailsRequest.dispose();
    }

    await expect(adminProductEditPage.loadingStatus).toHaveCount(0);

    await expect(adminProductEditPage.form.titleInput).toHaveValue(EDIT_PRODUCT.title);
    await expect(adminProductEditPage.form.priceInput).toHaveValue(String(EDIT_PRODUCT.price));
    await expect(adminProductEditPage.form.stockInput).toHaveValue(String(EDIT_PRODUCT.stock));
    await expect(adminProductEditPage.form.categoryInput).toHaveValue(EDIT_PRODUCT.category);
    await expect(adminProductEditPage.form.imageUrlInput).toHaveValue(EDIT_PRODUCT.imageUrl);
    await expect(adminProductEditPage.form.descriptionInput).toHaveValue(EDIT_PRODUCT.description);

    await expect(adminProductEditPage.form.submitButton).toHaveText("Save changes");

    await expect(adminProductEditPage.preview.productTitle).toHaveText(EDIT_PRODUCT.title);
    await expect(adminProductEditPage.preview.category).toHaveText(EDIT_PRODUCT.category);

    await expect(adminProductEditPage.deleteSection).toBeVisible();
    await expect(adminProductEditPage.deleteButton).toBeEnabled();

    await expect(page).toHaveTitle(`Edit ${EDIT_PRODUCT.title} | NovaShop`);

    await adminProductEditPage.deleteButton.click();

    await expect(adminProductEditPage.deleteDialog.root).toBeVisible();
    await expect(adminProductEditPage.deleteDialog.root).toHaveAccessibleDescription(
      `Are you sure you want to delete "${EDIT_PRODUCT.title}"? This action cannot be undone.`,
    );

    await adminProductEditPage.deleteDialog.cancel();

    await expect(adminProductEditPage.deleteDialog.root).toHaveCount(0);
  });

  test.describe("product not found", () => {
    const cases = [
      {
        name: "404 PRODUCT_NOT_FOUND",
        productId: MISSING_PRODUCT_ID,
        prepareResponse: prepareProductDetailsNotFound,
      },
      {
        name: "400 VALIDATION_ERROR",
        productId: INVALID_PRODUCT_ID,
        prepareResponse: prepareProductDetailsValidationFailure,
      },
    ];

    for (const { name, productId, prepareResponse } of cases) {
      test(`shows product not found for ${name}`, async ({ page }) => {
        await prepareResponse(page, productId);

        await adminProductEditPage.open(productId);

        await expect(adminProductEditPage.notFoundTitle).toBeVisible();
        await expect(adminProductEditPage.notFoundDescription).toBeVisible();

        await expect(adminProductEditPage.backToAdminProductsLink).toBeVisible();
        await expect(adminProductEditPage.backToAdminProductsLink).toHaveAttribute(
          "href",
          "/admin/products",
        );

        await expect(adminProductEditPage.form.titleInput).toHaveCount(0);
        await expect(adminProductEditPage.preview.productTitle).toHaveCount(0);
        await expect(adminProductEditPage.deleteSection).toHaveCount(0);
      });
    }
  });

  test("shows a standalone error state when product loading fails", async ({ page }) => {
    await prepareProductDetailsServerFailure(page, EDIT_PRODUCT.id);

    await adminProductEditPage.open(EDIT_PRODUCT.id);

    await expect(adminProductEditPage.loadErrorAlert).toBeVisible();
    await expect(adminProductEditPage.loadErrorAlert).toContainText("Internal server error");

    await expect(adminProductEditPage.backToAdminProductsLink).toBeVisible();
    await expect(adminProductEditPage.backToAdminProductsLink).toHaveAttribute(
      "href",
      "/admin/products",
    );

    await expect(adminProductEditPage.form.titleInput).toHaveCount(0);
    await expect(adminProductEditPage.preview.productTitle).toHaveCount(0);
    await expect(adminProductEditPage.deleteSection).toHaveCount(0);
    await expect(adminProductEditPage.notFoundTitle).toHaveCount(0);
  });

  test("maps the update request and recovers after a failed save", async ({ page }) => {
    await prepareProductDetails(page, EDIT_PRODUCT);
    await adminProductEditPage.open(EDIT_PRODUCT.id);

    await expect(adminProductEditPage.form.titleInput).toHaveValue(EDIT_PRODUCT.title);

    const updateProductApiUrl = buildProductApiUrl(EDIT_PRODUCT.id);
    const editedTitle = `  ${EDIT_PRODUCT.title} Updated  `;
    const editedPrice = "125.5";

    let updateRequestCount = 0;

    page.on("request", (request) => {
      if (request.url() === updateProductApiUrl && request.method() === "PATCH") {
        updateRequestCount += 1;
      }
    });

    await test.step("change representative product fields", async () => {
      await adminProductEditPage.form.titleInput.fill(editedTitle);
      await adminProductEditPage.form.priceInput.fill(editedPrice);

      await expect(adminProductEditPage.preview.productTitle).toHaveText(editedTitle.trim());
    });

    // Register PATCH after the detail GET setup because both use the same URL,
    // and the detail helper intentionally aborts non-GET methods.
    const heldUpdateRequest = await holdRequestUntilReleased(page, {
      url: updateProductApiUrl,
      method: "PATCH",
      fulfillWith: {
        status: 500,
        json: UPDATE_FAILURE_RESPONSE,
      },
    });

    try {
      await test.step("send the complete mapped ProductInput", async () => {
        // The counter checks duplicate requests; waitForRequest lets us inspect the PATCH body.
        const updateRequestPromise = page.waitForRequest((request) => {
          return request.url() === updateProductApiUrl && request.method() === "PATCH";
        });

        await Promise.all([
          adminProductEditPage.form.submitButton.click(),
          heldUpdateRequest.requestObserved,
        ]);

        const updateRequest = await updateRequestPromise;

        expect(updateRequest.postDataJSON()).toEqual({
          title: `${EDIT_PRODUCT.title} Updated`,
          price: Number(editedPrice),
          stock: EDIT_PRODUCT.stock,
          category: EDIT_PRODUCT.category,
          imageUrl: EDIT_PRODUCT.imageUrl,
          description: EDIT_PRODUCT.description,
        });
      });

      await test.step("show pending state and block a duplicate PATCH", async () => {
        await expect(adminProductEditPage.form.submitButton).toHaveText("Saving...");
        await expect(adminProductEditPage.form.submitButton).toBeDisabled();
        await expect(adminProductEditPage.form.submitButton).toHaveAttribute("aria-busy", "true");
        await expect(adminProductEditPage.form.cancelButton).toBeDisabled();

        await adminProductEditPage.form.titleInput.press("Enter");
      });

      await test.step("preserve edits and recover after the failure", async () => {
        heldUpdateRequest.release();

        await expect(adminProductEditPage.form.formError).toHaveText(
          UPDATE_FAILURE_RESPONSE.error.message,
        );

        expect(updateRequestCount).toBe(1);

        await expect(page).toHaveURL(`/admin/products/${EDIT_PRODUCT.id}/edit`);

        await expect(adminProductEditPage.form.titleInput).toHaveValue(editedTitle);
        await expect(adminProductEditPage.form.priceInput).toHaveValue(editedPrice);

        await expect(adminProductEditPage.form.submitButton).toHaveText("Save changes");
        await expect(adminProductEditPage.form.submitButton).toBeEnabled();
        await expect(adminProductEditPage.form.cancelButton).toBeEnabled();

        const toast = new ToastComponent(page);
        await expect(toast.closeButton).toHaveCount(0);

        await adminProductEditPage.form.titleInput.fill(`${EDIT_PRODUCT.title} Updated again`);

        await expect(adminProductEditPage.form.formError).toHaveCount(0);
      });
    } finally {
      await heldUpdateRequest.dispose();
    }
  });

  test("returns to admin products on cancel without updating the product", async ({ page }) => {
    await prepareProductDetails(page, EDIT_PRODUCT);
    await prepareProductCatalog(page, [EDIT_PRODUCT]);

    const adminProductsPage = new AdminProductsPage(page);
    const updateProductApiUrl = buildProductApiUrl(EDIT_PRODUCT.id);

    let updateRequestCount = 0;

    page.on("request", (request) => {
      if (request.url() === updateProductApiUrl && request.method() === "PATCH") {
        updateRequestCount += 1;
      }
    });

    await adminProductEditPage.open(EDIT_PRODUCT.id);

    await expect(adminProductEditPage.form.titleInput).toHaveValue(EDIT_PRODUCT.title);

    await adminProductEditPage.form.titleInput.fill(`${EDIT_PRODUCT.title} Unsaved`);

    await adminProductEditPage.form.cancelButton.click();

    await expect(page).toHaveURL("/admin/products");
    await expect(adminProductsPage.getProductRow(EDIT_PRODUCT.title)).toBeVisible();

    await expect(adminProductsPage.getProductRow(`${EDIT_PRODUCT.title} Unsaved`)).toHaveCount(0);

    expect(updateRequestCount).toBe(0);
  });
});
