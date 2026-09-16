import { expect, test } from "../../src/fixtures";
import {
  holdProductDetailsUntilReleased,
  prepareMockedAuthenticatedSession,
  prepareProductDetails,
  prepareProductDetailsNotFound,
  prepareProductDetailsServerFailure,
  prepareProductDetailsValidationFailure,
} from "../../src/helpers";
import { ProductDetailsPage } from "../../src/pages";
import { ADD_TO_CART_PRODUCT_A, REGULAR_USER, createProduct } from "../../src/test-data";
import { formatUsd } from "../../src/utils";

const MISSING_PRODUCT_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const INVALID_PRODUCT_ID = "not-a-uuid";

test.describe("product details", () => {
  let productDetailsPage: ProductDetailsPage;

  test.beforeEach(async ({ page }) => {
    await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);

    productDetailsPage = new ProductDetailsPage(page);
  });

  test("preserves a clean loading state until product details are available", async ({ page }) => {
    const product = createProduct(ADD_TO_CART_PRODUCT_A);
    const heldProductRequest = await holdProductDetailsUntilReleased(page, product);

    try {
      await Promise.all([productDetailsPage.open(product.id), heldProductRequest.requestObserved]);

      await expect(productDetailsPage.loadingStatus).toBeVisible();
      await expect(productDetailsPage.productContent).toHaveCount(0);
      await expect(productDetailsPage.addToCart.quantityInput).toHaveCount(0);
      await expect(productDetailsPage.notFoundTitle).toHaveCount(0);
      await expect(productDetailsPage.errorAlert).toHaveCount(0);
      await expect(productDetailsPage.backLink).toHaveCount(0);
    } finally {
      heldProductRequest.release();
      await heldProductRequest.dispose();
    }

    await expect(productDetailsPage.loadingStatus).toBeHidden();
    await expect(productDetailsPage.productContent).toBeVisible();
    await expect(productDetailsPage.heading).toHaveText(product.title);
    await expect(productDetailsPage.addToCart.quantityInput).toBeVisible();
    await expect(productDetailsPage.notFoundTitle).toHaveCount(0);
    await expect(productDetailsPage.errorAlert).toHaveCount(0);
  });

  test("shows complete details for a loaded product", async ({ page }) => {
    const product = createProduct(ADD_TO_CART_PRODUCT_A);

    await prepareProductDetails(page, product);
    await productDetailsPage.open(product.id);

    await expect(productDetailsPage.root).toHaveAccessibleName(product.title);
    await expect(productDetailsPage.heading).toHaveText(product.title);
    await expect(productDetailsPage.category).toHaveText(product.category);
    await expect(productDetailsPage.description).toHaveText(product.description);
    await expect(productDetailsPage.price).toHaveText(formatUsd(product.price));

    await expect(productDetailsPage.image).toHaveAttribute("src", product.imageUrl);
    await expect(productDetailsPage.image).toHaveAttribute("alt", "");

    await expect(productDetailsPage.purchaseOptionsHeading).toBeVisible();
    await expect(productDetailsPage.addToCart.quantityInput).toHaveValue("1");
    await expect(productDetailsPage.addToCart.available).toHaveText(`Available: ${product.stock}`);
    await expect(productDetailsPage.addToCart.inCart).toHaveCount(0);
    await expect(productDetailsPage.addToCart.quantityHint).toHaveText(
      `Choose a quantity from 1 to ${product.stock}.`,
    );

    await expect(productDetailsPage.backLink).toHaveAttribute("href", "/products");
    await expect(page).toHaveTitle(`${product.title} | NovaShop`);
  });

  test("shows the not-found state for a missing product", async ({ page }) => {
    await prepareProductDetailsNotFound(page, MISSING_PRODUCT_ID);
    await productDetailsPage.open(MISSING_PRODUCT_ID);

    await expect(productDetailsPage.notFoundTitle).toBeVisible();
    await expect(productDetailsPage.root).toContainText(
      "This product does not exist or is no longer available.",
    );
    await expect(productDetailsPage.backLink).toBeVisible();
    await expect(productDetailsPage.backLink).toHaveAttribute("href", "/products");
    await expect(page).toHaveTitle("Product not found | NovaShop");

    await expect(productDetailsPage.loadingStatus).toBeHidden();
    await expect(productDetailsPage.productContent).toHaveCount(0);
    await expect(productDetailsPage.addToCart.quantityInput).toHaveCount(0);
    await expect(productDetailsPage.errorAlert).toHaveCount(0);
  });

  test("shows the not-found state for an invalid product id", async ({ page }) => {
    await prepareProductDetailsValidationFailure(page, INVALID_PRODUCT_ID);
    await productDetailsPage.open(INVALID_PRODUCT_ID);

    await expect(productDetailsPage.notFoundTitle).toBeVisible();
    await expect(productDetailsPage.root).toContainText(
      "This product does not exist or is no longer available.",
    );
    await expect(productDetailsPage.backLink).toBeVisible();
    await expect(productDetailsPage.backLink).toHaveAttribute("href", "/products");
    await expect(page).toHaveTitle("Product not found | NovaShop");

    await expect(productDetailsPage.loadingStatus).toBeHidden();
    await expect(productDetailsPage.productContent).toHaveCount(0);
    await expect(productDetailsPage.addToCart.quantityInput).toHaveCount(0);
    await expect(productDetailsPage.errorAlert).toHaveCount(0);
  });

  test("shows a standalone error state when product loading fails", async ({ page }) => {
    const product = createProduct(ADD_TO_CART_PRODUCT_A);

    await prepareProductDetailsServerFailure(page, product.id);
    await productDetailsPage.open(product.id);

    await expect(productDetailsPage.errorAlert).toBeVisible();
    await expect(productDetailsPage.errorAlert).toContainText("Internal server error");
    await expect(page).toHaveTitle("Product details | NovaShop");

    await expect(productDetailsPage.loadingStatus).toBeHidden();
    await expect(productDetailsPage.productContent).toHaveCount(0);
    await expect(productDetailsPage.addToCart.quantityInput).toHaveCount(0);
    await expect(productDetailsPage.notFoundTitle).toHaveCount(0);
    await expect(productDetailsPage.backLink).toHaveCount(0);
  });
});
