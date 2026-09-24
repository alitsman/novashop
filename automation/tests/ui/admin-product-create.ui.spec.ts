import { ToastComponent } from "../../src/components";
import { apiUrl } from "../../src/config/playwright.shared";
import { expect, test } from "../../src/fixtures";
import {
  holdRequestUntilReleased,
  prepareMockedAuthenticatedSession,
  prepareProductCatalog,
} from "../../src/helpers";
import { AdminProductCreatePage, AdminProductsPage } from "../../src/pages";
import {
  ADMIN_PRODUCT_CREATE_FAILURE_RESPONSE,
  ADMIN_PRODUCT_VALID_INPUT,
  ADMIN_USER,
} from "../../src/test-data";

const PRODUCTS_API_URL = new URL("/products", apiUrl).toString();

test.describe("admin product create", () => {
  test("shows the create form and returns to admin products on cancel", async ({ page }) => {
    let createProductRequestCount = 0;

    page.on("request", (request) => {
      if (request.url() === PRODUCTS_API_URL && request.method() === "POST") {
        createProductRequestCount += 1;
      }
    });

    await prepareMockedAuthenticatedSession(page, ADMIN_USER.user);
    await prepareProductCatalog(page, []);

    const adminProductCreatePage = new AdminProductCreatePage(page);
    const adminProductsPage = new AdminProductsPage(page);
    const toast = new ToastComponent(page);

    await adminProductCreatePage.open();

    await expect(adminProductCreatePage.heading).toBeVisible();
    await expect(adminProductCreatePage.description).toBeVisible();

    await expect(adminProductCreatePage.form.titleInput).toBeVisible();
    await expect(adminProductCreatePage.form.priceInput).toBeVisible();
    await expect(adminProductCreatePage.form.stockInput).toBeVisible();
    await expect(adminProductCreatePage.form.categoryInput).toBeVisible();
    await expect(adminProductCreatePage.form.imageUrlInput).toBeVisible();
    await expect(adminProductCreatePage.form.descriptionInput).toBeVisible();

    await expect(adminProductCreatePage.form.submitButton).toHaveText("Create product");
    await expect(adminProductCreatePage.form.cancelButton).toBeEnabled();

    await adminProductCreatePage.form.cancelButton.click();

    await expect(page).toHaveURL("/admin/products");
    await expect(adminProductsPage.heading).toBeVisible();
    await expect(adminProductsPage.emptyStateTitle).toBeVisible();
    await expect(toast.closeButton).toHaveCount(0);

    expect(createProductRequestCount).toBe(0);
  });

  test("shows pending state, prevents duplicate creation, and preserves values after failure", async ({
    page,
  }) => {
    let createProductRequestCount = 0;

    page.on("request", (request) => {
      if (request.url() === PRODUCTS_API_URL && request.method() === "POST") {
        createProductRequestCount += 1;
      }
    });

    await prepareMockedAuthenticatedSession(page, ADMIN_USER.user);

    const adminProductCreatePage = new AdminProductCreatePage(page);
    const toast = new ToastComponent(page);

    await adminProductCreatePage.open();

    await adminProductCreatePage.form.titleInput.fill(ADMIN_PRODUCT_VALID_INPUT.title);
    await adminProductCreatePage.form.priceInput.fill(String(ADMIN_PRODUCT_VALID_INPUT.price));
    await adminProductCreatePage.form.stockInput.fill(String(ADMIN_PRODUCT_VALID_INPUT.stock));
    await adminProductCreatePage.form.categoryInput.fill(ADMIN_PRODUCT_VALID_INPUT.category);
    await adminProductCreatePage.form.imageUrlInput.fill(ADMIN_PRODUCT_VALID_INPUT.imageUrl);
    await adminProductCreatePage.form.descriptionInput.fill(ADMIN_PRODUCT_VALID_INPUT.description);

    const heldCreateProductRequest = await holdRequestUntilReleased(page, {
      url: PRODUCTS_API_URL,
      method: "POST",
      fulfillWith: {
        status: 500,
        json: ADMIN_PRODUCT_CREATE_FAILURE_RESPONSE,
      },
    });

    try {
      await Promise.all([
        adminProductCreatePage.form.submitButton.click(),
        heldCreateProductRequest.requestObserved,
      ]);

      await expect(adminProductCreatePage.form.submitButton).toHaveText("Creating...");
      await expect(adminProductCreatePage.form.submitButton).toBeDisabled();
      await expect(adminProductCreatePage.form.submitButton).toHaveAttribute("aria-busy", "true");
      await expect(adminProductCreatePage.form.cancelButton).toBeDisabled();

      await adminProductCreatePage.form.titleInput.press("Enter");

      heldCreateProductRequest.release();

      await expect(adminProductCreatePage.form.formError).toHaveText(
        ADMIN_PRODUCT_CREATE_FAILURE_RESPONSE.error.message,
      );

      expect(createProductRequestCount).toBe(1);

      await expect(page).toHaveURL("/admin/products/new");

      await expect(adminProductCreatePage.form.titleInput).toHaveValue(
        ADMIN_PRODUCT_VALID_INPUT.title,
      );
      await expect(adminProductCreatePage.form.priceInput).toHaveValue(
        String(ADMIN_PRODUCT_VALID_INPUT.price),
      );
      await expect(adminProductCreatePage.form.stockInput).toHaveValue(
        String(ADMIN_PRODUCT_VALID_INPUT.stock),
      );
      await expect(adminProductCreatePage.form.categoryInput).toHaveValue(
        ADMIN_PRODUCT_VALID_INPUT.category,
      );
      await expect(adminProductCreatePage.form.imageUrlInput).toHaveValue(
        ADMIN_PRODUCT_VALID_INPUT.imageUrl,
      );
      await expect(adminProductCreatePage.form.descriptionInput).toHaveValue(
        ADMIN_PRODUCT_VALID_INPUT.description,
      );

      await expect(adminProductCreatePage.form.submitButton).toHaveText("Create product");
      await expect(adminProductCreatePage.form.submitButton).toBeEnabled();
      await expect(adminProductCreatePage.form.cancelButton).toBeEnabled();
      await expect(toast.closeButton).toHaveCount(0);
    } finally {
      await heldCreateProductRequest.dispose();
    }

    await adminProductCreatePage.form.titleInput.fill(`${ADMIN_PRODUCT_VALID_INPUT.title} Updated`);

    await expect(adminProductCreatePage.form.formError).toHaveCount(0);

    await page.route(PRODUCTS_API_URL, async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();

        return;
      }

      await route.fulfill({
        status: 500,
        json: ADMIN_PRODUCT_CREATE_FAILURE_RESPONSE,
      });
    });

    const retryRequestPromise = page.waitForRequest((request) => {
      return request.url() === PRODUCTS_API_URL && request.method() === "POST";
    });

    await adminProductCreatePage.form.submitButton.click();

    await retryRequestPromise;

    await expect(adminProductCreatePage.form.formError).toHaveText(
      ADMIN_PRODUCT_CREATE_FAILURE_RESPONSE.error.message,
    );

    expect(createProductRequestCount).toBe(2);
  });
});
