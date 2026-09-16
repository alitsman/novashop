import { expect, test } from "../../src/fixtures";
import {
  prepareCart,
  prepareMockedAuthenticatedSession,
  prepareProductDetails,
} from "../../src/helpers";
import { ProductDetailsPage } from "../../src/pages";
import {
  OUT_OF_STOCK_PRODUCT,
  QUANTITY_PRODUCT,
  REGULAR_USER,
  STALE_CART_PRODUCT,
  createCartItem,
  createProduct,
} from "../../src/test-data";

test.describe("add to cart control", () => {
  let productDetailsPage: ProductDetailsPage;

  test.beforeEach(async ({ page }) => {
    await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);

    productDetailsPage = new ProductDetailsPage(page);
  });

  test("changes quantity with increment and decrement buttons", async ({ page }) => {
    const product = createProduct(QUANTITY_PRODUCT);

    await prepareProductDetails(page, product);
    await productDetailsPage.open(product.id);

    await expect(productDetailsPage.addToCart.quantityInput).toHaveValue("1");
    await expect(productDetailsPage.addToCart.decreaseButton).toBeDisabled();

    await productDetailsPage.addToCart.increaseQuantity();
    await expect(productDetailsPage.addToCart.quantityInput).toHaveValue("2");

    await productDetailsPage.addToCart.decreaseQuantity();
    await expect(productDetailsPage.addToCart.quantityInput).toHaveValue("1");

    await productDetailsPage.addToCart.increaseQuantity(product.stock - 1);

    await expect(productDetailsPage.addToCart.quantityInput).toHaveValue(String(product.stock));
    await expect(productDetailsPage.addToCart.increaseButton).toBeDisabled();
  });

  test("changes quantity with ArrowUp and ArrowDown keys", async ({ page }) => {
    const product = createProduct(QUANTITY_PRODUCT);

    await prepareProductDetails(page, product);
    await productDetailsPage.open(product.id);

    await expect(productDetailsPage.addToCart.quantityInput).toHaveValue("1");

    await productDetailsPage.addToCart.pressQuantityKey("ArrowDown");
    await expect(productDetailsPage.addToCart.quantityInput).toHaveValue("1");

    await productDetailsPage.addToCart.pressQuantityKey("ArrowUp");
    await expect(productDetailsPage.addToCart.quantityInput).toHaveValue("2");

    await productDetailsPage.addToCart.pressQuantityKey("ArrowDown");
    await expect(productDetailsPage.addToCart.quantityInput).toHaveValue("1");

    await productDetailsPage.addToCart.pressQuantityKey("ArrowUp", product.stock - 1);

    await expect(productDetailsPage.addToCart.quantityInput).toHaveValue(String(product.stock));

    await productDetailsPage.addToCart.pressQuantityKey("ArrowUp");

    await expect(productDetailsPage.addToCart.quantityInput).toHaveValue(String(product.stock));
  });

  test("accepts valid manually entered quantities", async ({ page }) => {
    const product = createProduct(QUANTITY_PRODUCT);

    await prepareProductDetails(page, product);
    await productDetailsPage.open(product.id);

    await expect(productDetailsPage.addToCart.quantityInput).toHaveValue("1");

    await productDetailsPage.addToCart.fillQuantity(String(product.stock - 1));

    await expect(productDetailsPage.addToCart.quantityInput).toHaveValue(String(product.stock - 1));
    await expect(productDetailsPage.addToCart.quantityError).toHaveCount(0);
    await expect(productDetailsPage.addToCart.quantityInput).toHaveAttribute(
      "aria-invalid",
      "false",
    );
    await expect(productDetailsPage.addToCart.addToCartButton).toBeEnabled();

    await productDetailsPage.addToCart.fillQuantity(String(product.stock));

    await expect(productDetailsPage.addToCart.quantityInput).toHaveValue(String(product.stock));
    await expect(productDetailsPage.addToCart.quantityError).toHaveCount(0);
    await expect(productDetailsPage.addToCart.quantityInput).toHaveAttribute(
      "aria-invalid",
      "false",
    );
    await expect(productDetailsPage.addToCart.addToCartButton).toBeEnabled();
  });

  test("validates invalid manual quantities and recovers", async ({ page }) => {
    const product = createProduct(QUANTITY_PRODUCT);
    const excessiveQuantity = product.stock + 10;

    await prepareProductDetails(page, product);
    await productDetailsPage.open(product.id);

    await test.step("recover from an empty quantity", async () => {
      await productDetailsPage.addToCart.fillQuantity("");

      await expect(productDetailsPage.addToCart.quantityInput).toHaveValue("");
      await expect(productDetailsPage.addToCart.quantityError).toHaveText("Enter a quantity.");
      await expect(productDetailsPage.addToCart.quantityError).toHaveRole("alert");
      await expect(productDetailsPage.addToCart.quantityInput).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      await expect(productDetailsPage.addToCart.quantityInput).toHaveAccessibleDescription(
        `Choose a quantity from 1 to ${product.stock}. Enter a quantity.`,
      );
      await expect(productDetailsPage.addToCart.decreaseButton).toBeDisabled();
      await expect(productDetailsPage.addToCart.increaseButton).toBeDisabled();
      await expect(productDetailsPage.addToCart.addToCartButton).toBeDisabled();

      await productDetailsPage.addToCart.fillQuantity("1");

      await expect(productDetailsPage.addToCart.quantityError).toHaveCount(0);
      await expect(productDetailsPage.addToCart.quantityInput).toHaveAttribute(
        "aria-invalid",
        "false",
      );
      await expect(productDetailsPage.addToCart.quantityInput).toHaveAccessibleDescription(
        `Choose a quantity from 1 to ${product.stock}.`,
      );
      await expect(productDetailsPage.addToCart.addToCartButton).toBeEnabled();
    });

    await test.step("recover from a quantity below the minimum", async () => {
      await productDetailsPage.addToCart.fillQuantity("0");

      await expect(productDetailsPage.addToCart.quantityInput).toHaveValue("0");
      await expect(productDetailsPage.addToCart.quantityError).toHaveText(
        "Quantity must be at least 1.",
      );
      await expect(productDetailsPage.addToCart.quantityError).toHaveRole("alert");
      await expect(productDetailsPage.addToCart.quantityInput).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      await expect(productDetailsPage.addToCart.quantityInput).toHaveAccessibleDescription(
        `Choose a quantity from 1 to ${product.stock}. Quantity must be at least 1.`,
      );
      await expect(productDetailsPage.addToCart.decreaseButton).toBeDisabled();
      await expect(productDetailsPage.addToCart.increaseButton).toBeEnabled();
      await expect(productDetailsPage.addToCart.addToCartButton).toBeDisabled();

      await productDetailsPage.addToCart.increaseQuantity();

      await expect(productDetailsPage.addToCart.quantityInput).toHaveValue("1");
      await expect(productDetailsPage.addToCart.quantityError).toHaveCount(0);
      await expect(productDetailsPage.addToCart.quantityInput).toHaveAttribute(
        "aria-invalid",
        "false",
      );
      await expect(productDetailsPage.addToCart.quantityInput).toHaveAccessibleDescription(
        `Choose a quantity from 1 to ${product.stock}.`,
      );
      await expect(productDetailsPage.addToCart.addToCartButton).toBeEnabled();
    });

    await test.step("recover from a quantity above available stock", async () => {
      await productDetailsPage.addToCart.fillQuantity(String(excessiveQuantity));

      await expect(productDetailsPage.addToCart.quantityInput).toHaveValue(
        String(excessiveQuantity),
      );
      await expect(productDetailsPage.addToCart.quantityError).toHaveText(
        `Only ${product.stock} items are available to add.`,
      );
      await expect(productDetailsPage.addToCart.quantityError).toHaveRole("alert");
      await expect(productDetailsPage.addToCart.quantityInput).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      await expect(productDetailsPage.addToCart.quantityInput).toHaveAccessibleDescription(
        `Choose a quantity from 1 to ${product.stock}. Only ${product.stock} items are available to add.`,
      );
      await expect(productDetailsPage.addToCart.decreaseButton).toBeEnabled();
      await expect(productDetailsPage.addToCart.increaseButton).toBeDisabled();
      await expect(productDetailsPage.addToCart.addToCartButton).toBeDisabled();

      await productDetailsPage.addToCart.decreaseQuantity();

      await expect(productDetailsPage.addToCart.quantityInput).toHaveValue(String(product.stock));
      await expect(productDetailsPage.addToCart.quantityError).toHaveCount(0);
      await expect(productDetailsPage.addToCart.quantityInput).toHaveAttribute(
        "aria-invalid",
        "false",
      );
      await expect(productDetailsPage.addToCart.quantityInput).toHaveAccessibleDescription(
        `Choose a quantity from 1 to ${product.stock}.`,
      );
      await expect(productDetailsPage.addToCart.addToCartButton).toBeEnabled();
    });
  });

  test("handles pasted quantity values", async ({ browserName, context, page }) => {
    // Chromium-only: this scenario requires browser clipboard permissions.
    test.skip(
      browserName !== "chromium",
      "Clipboard-based paste is supported only in the Chromium project.",
    );

    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    const product = createProduct(QUANTITY_PRODUCT);

    await prepareProductDetails(page, product);
    await productDetailsPage.open(product.id);

    await productDetailsPage.addToCart.pasteQuantity("3");
    await expect(productDetailsPage.addToCart.quantityInput).toHaveValue("3");

    await productDetailsPage.addToCart.pasteQuantity("-4");
    await expect(productDetailsPage.addToCart.quantityInput).toHaveValue("3");

    await productDetailsPage.addToCart.pasteQuantity("1.5");
    await expect(productDetailsPage.addToCart.quantityInput).toHaveValue("3");

    await productDetailsPage.addToCart.pasteQuantity("1e2");
    await expect(productDetailsPage.addToCart.quantityInput).toHaveValue("3");
  });

  test("prevents purchasing an out-of-stock product", async ({ page }) => {
    const product = createProduct(OUT_OF_STOCK_PRODUCT);

    await prepareProductDetails(page, product);
    await productDetailsPage.open(product.id);

    await expect(productDetailsPage.addToCart.inCart).toHaveCount(0);
    await expect(productDetailsPage.addToCart.available).toHaveCount(0);
    await expect(productDetailsPage.addToCart.productAvailability).toContainText(
      "No more items available",
    );

    await expect(productDetailsPage.addToCart.quantityInput).toHaveValue("1");
    await expect(productDetailsPage.addToCart.quantityInput).toBeDisabled();
    await expect(productDetailsPage.addToCart.decreaseButton).toBeDisabled();
    await expect(productDetailsPage.addToCart.increaseButton).toBeDisabled();
    await expect(productDetailsPage.addToCart.addToCartButton).toBeDisabled();
    await expect(productDetailsPage.addToCart.addToCartButton).toHaveAccessibleName(
      `No more items available for ${product.title}`,
    );

    await expect(productDetailsPage.addToCart.quantityHint).toHaveText(
      "This product cannot be added right now.",
    );
    await expect(productDetailsPage.addToCart.quantityInput).toHaveAttribute(
      "aria-invalid",
      "false",
    );
    await expect(productDetailsPage.addToCart.quantityError).toHaveCount(0);
  });

  test("handles a cart quantity above the current stock", async ({ page }) => {
    const product = createProduct(STALE_CART_PRODUCT);
    const quantityInCart = product.stock + 2;

    await prepareCart(page, REGULAR_USER.user.id, [
      createCartItem(product, {
        quantity: quantityInCart,
      }),
    ]);
    await prepareProductDetails(page, product);
    await productDetailsPage.open(product.id);

    await expect(productDetailsPage.header.cartLink).toHaveAccessibleName(
      `Cart, ${quantityInCart} items`,
    );
    await expect(productDetailsPage.addToCart.inCart).toHaveText(`In cart: ${quantityInCart}`);
    await expect(productDetailsPage.addToCart.available).toHaveCount(0);
    await expect(productDetailsPage.addToCart.productAvailability).toContainText(
      "No more items available",
    );

    await expect(productDetailsPage.addToCart.quantityInput).toBeDisabled();
    await expect(productDetailsPage.addToCart.decreaseButton).toBeDisabled();
    await expect(productDetailsPage.addToCart.increaseButton).toBeDisabled();
    await expect(productDetailsPage.addToCart.addToCartButton).toBeDisabled();
    await expect(productDetailsPage.addToCart.addToCartButton).toHaveAccessibleName(
      `No more items available for ${product.title}`,
    );
    await expect(productDetailsPage.addToCart.quantityHint).toHaveText(
      "This product cannot be added right now.",
    );
    await expect(productDetailsPage.addToCart.quantityError).toHaveCount(0);
  });
});
