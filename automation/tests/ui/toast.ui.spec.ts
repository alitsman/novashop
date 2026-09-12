import { ToastComponent } from "../../src/components";
import { expect, test } from "../../src/fixtures";
import { prepareMockedAuthenticatedSession, prepareProductCatalog } from "../../src/helpers";
import { ProductCatalogPage } from "../../src/pages";
import { ADD_TO_CART_PRODUCT_A, REGULAR_USER, createProduct } from "../../src/test-data";

// The product dismisses a toast after 4 seconds; allow extra time for a slow test runner.
const TOAST_AUTO_DISMISS_TIMEOUT_MS = 8_000;

// The live region remains in the DOM so screen readers can announce future messages.
// Lifecycle assertions therefore check its content and the separate close button.
test.describe("toast", () => {
  let catalogPage: ProductCatalogPage;
  let toast: ToastComponent;

  test.beforeEach(async ({ page }) => {
    await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);
    await prepareProductCatalog(page, [createProduct(ADD_TO_CART_PRODUCT_A)]);

    catalogPage = new ProductCatalogPage(page);
    toast = new ToastComponent(page);

    await catalogPage.open();
  });

  test("manual close: removes the active notification", async () => {
    const productCard = catalogPage.getProductCard(ADD_TO_CART_PRODUCT_A.title);

    await productCard.addToCart.submit();
    await expect(toast.closeButton).toBeVisible();

    await toast.close();

    await expect(toast.message).toBeEmpty();
    await expect(toast.closeButton).toHaveCount(0);
  });

  test("auto-dismiss: removes the notification without user action", async () => {
    const productCard = catalogPage.getProductCard(ADD_TO_CART_PRODUCT_A.title);

    await productCard.addToCart.submit();
    await expect(toast.closeButton).toBeVisible();

    await expect(toast.message).toBeEmpty({
      timeout: TOAST_AUTO_DISMISS_TIMEOUT_MS,
    });
    await expect(toast.closeButton).toHaveCount(0);
  });
});
