import { expect, test } from "../../src/fixtures";
import { prepareMockedAuthenticatedSession } from "../../src/helpers";
import { AdminProductCreatePage } from "../../src/pages";
import { ADMIN_PRODUCT_VALID_INPUT, ADMIN_USER } from "../../src/test-data";

test.describe("admin product form", () => {
  let adminProductCreatePage: AdminProductCreatePage;

  test.beforeEach(async ({ page }) => {
    await prepareMockedAuthenticatedSession(page, ADMIN_USER.user);

    adminProductCreatePage = new AdminProductCreatePage(page);

    await adminProductCreatePage.open();
  });

  test("updates product preview while the admin fills in the form", async ({ page }) => {
    // Isolated UI blocks images globally, so provide one controlled successful
    // image response to prove the preview's successful image state.
    await page.route(ADMIN_PRODUCT_VALID_INPUT.imageUrl, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>',
      });
    });

    await expect(adminProductCreatePage.heading).toBeVisible();

    await expect(adminProductCreatePage.preview.productTitle).toHaveText("Product title");
    await expect(adminProductCreatePage.preview.category).toHaveText("Category");
    await expect(adminProductCreatePage.preview.description).toHaveText(
      "Product description will appear here.",
    );
    await expect(adminProductCreatePage.preview.price).toHaveText("$0.00");
    await expect(adminProductCreatePage.preview.stock).toHaveText("Stock quantity");
    await expect(adminProductCreatePage.preview.image).toHaveCount(0);
    await expect(adminProductCreatePage.preview.imagePlaceholder).toHaveText(
      "Product image will appear here",
    );

    await adminProductCreatePage.form.titleInput.fill(ADMIN_PRODUCT_VALID_INPUT.title);
    await adminProductCreatePage.form.priceInput.fill(String(ADMIN_PRODUCT_VALID_INPUT.price));
    await adminProductCreatePage.form.stockInput.fill(String(ADMIN_PRODUCT_VALID_INPUT.stock));
    await adminProductCreatePage.form.categoryInput.fill(ADMIN_PRODUCT_VALID_INPUT.category);
    await adminProductCreatePage.form.imageUrlInput.fill(ADMIN_PRODUCT_VALID_INPUT.imageUrl);
    await adminProductCreatePage.form.descriptionInput.fill(ADMIN_PRODUCT_VALID_INPUT.description);

    await expect(adminProductCreatePage.preview.productTitle).toHaveText(
      ADMIN_PRODUCT_VALID_INPUT.title,
    );
    await expect(adminProductCreatePage.preview.category).toHaveText(
      ADMIN_PRODUCT_VALID_INPUT.category,
    );
    await expect(adminProductCreatePage.preview.description).toHaveText(
      ADMIN_PRODUCT_VALID_INPUT.description,
    );
    await expect(adminProductCreatePage.preview.price).toHaveText("$84.75");
    await expect(adminProductCreatePage.preview.stock).toHaveText("7 in stock");

    await expect(adminProductCreatePage.preview.image).toHaveAttribute(
      "src",
      ADMIN_PRODUCT_VALID_INPUT.imageUrl,
    );
    await expect(adminProductCreatePage.preview.image).toHaveAttribute(
      "alt",
      ADMIN_PRODUCT_VALID_INPUT.title,
    );
    await expect(adminProductCreatePage.preview.imagePlaceholder).toHaveCount(0);

    await expect(adminProductCreatePage.preview.actions).toHaveAttribute("aria-hidden", "true");
  });

  test("shows the fallback price for a non-positive price", async () => {
    await adminProductCreatePage.form.priceInput.fill("0");

    await expect(adminProductCreatePage.preview.price).toHaveText("$0.00");
  });

  test("shows out of stock for zero stock", async () => {
    await adminProductCreatePage.form.stockInput.fill("0");

    await expect(adminProductCreatePage.preview.stock).toHaveText("Out of stock");
  });

  test("shows the stock placeholder for an invalid stock value", async () => {
    await adminProductCreatePage.form.stockInput.fill("-1");

    await expect(adminProductCreatePage.preview.stock).toHaveText("Stock quantity");
  });

  test("shows a fallback when the preview image fails to load", async ({ page }) => {
    // Fail this specific image explicitly so the scenario owns the load-error condition
    // instead of relying on the isolated UI fixture's global image blocking.
    await page.route(ADMIN_PRODUCT_VALID_INPUT.imageUrl, async (route) => {
      await route.abort();
    });

    await adminProductCreatePage.form.imageUrlInput.fill(ADMIN_PRODUCT_VALID_INPUT.imageUrl);

    await expect(adminProductCreatePage.preview.imagePlaceholder).toHaveText(
      "Image could not be loaded",
    );

    await expect(adminProductCreatePage.preview.image).toHaveCount(0);
  });
});
