import { expect, test } from "../../src/fixtures";
import { prepareMockedAuthenticatedSession, prepareProductCatalog } from "../../src/helpers";
import { ProductCatalogPage } from "../../src/pages";
import {
  OUT_OF_STOCK_PRODUCT,
  QUANTITY_PRODUCT,
  QUANTITY_PRODUCTS,
  REGULAR_USER,
  createProduct,
} from "../../src/test-data";

test.describe("add to cart control", () => {
  let catalogPage: ProductCatalogPage;

  test.beforeEach(async ({ page }) => {
    await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);

    const products = QUANTITY_PRODUCTS.map((product) => createProduct(product));
    await prepareProductCatalog(page, products);

    catalogPage = new ProductCatalogPage(page);
    await catalogPage.open();

    await expect(
      catalogPage.header.currentUserName,
      "Regular user session should be restored",
    ).toHaveText(REGULAR_USER.user.name);
  });

  test("changes quantity with increment and decrement buttons", async () => {
    const productCard = catalogPage.getProductCard(QUANTITY_PRODUCT.title);

    await expect(productCard.title).toBeVisible();
    await expect(productCard.addToCart.quantityInput).toHaveValue("1");
    await expect(productCard.addToCart.decreaseButton).toBeDisabled();

    await productCard.addToCart.increaseQuantity();
    await expect(productCard.addToCart.quantityInput).toHaveValue("2");

    await productCard.addToCart.decreaseQuantity();
    await expect(productCard.addToCart.quantityInput).toHaveValue("1");

    await productCard.addToCart.increaseQuantity(QUANTITY_PRODUCT.stock - 1);
    await expect(productCard.addToCart.quantityInput).toHaveValue(String(QUANTITY_PRODUCT.stock));
    await expect(productCard.addToCart.increaseButton).toBeDisabled();
  });

  test("changes quantity with ArrowUp and ArrowDown keys", async () => {
    const productCard = catalogPage.getProductCard(QUANTITY_PRODUCT.title);

    await expect(productCard.addToCart.quantityInput).toHaveValue("1");

    await productCard.addToCart.pressQuantityKey("ArrowDown");
    await expect(productCard.addToCart.quantityInput).toHaveValue("1");

    await productCard.addToCart.pressQuantityKey("ArrowUp");
    await expect(productCard.addToCart.quantityInput).toHaveValue("2");

    await productCard.addToCart.pressQuantityKey("ArrowDown");
    await expect(productCard.addToCart.quantityInput).toHaveValue("1");

    await productCard.addToCart.pressQuantityKey("ArrowUp", QUANTITY_PRODUCT.stock - 1);
    await expect(productCard.addToCart.quantityInput).toHaveValue(String(QUANTITY_PRODUCT.stock));

    await productCard.addToCart.pressQuantityKey("ArrowUp");
    await expect(productCard.addToCart.quantityInput).toHaveValue(String(QUANTITY_PRODUCT.stock));
  });

  test("accepts a valid manually entered quantity", async () => {
    const productCard = catalogPage.getProductCard(QUANTITY_PRODUCT.title);

    await expect(productCard.addToCart.quantityInput).toHaveValue("1");

    await productCard.addToCart.fillQuantity(String(QUANTITY_PRODUCT.stock - 1));
    await expect(productCard.addToCart.quantityInput).toHaveValue(
      String(QUANTITY_PRODUCT.stock - 1),
    );
    await expect(productCard.addToCart.quantityError).toBeHidden();
    await expect(productCard.addToCart.addToCartButton).toBeEnabled();

    await productCard.addToCart.fillQuantity(String(QUANTITY_PRODUCT.stock));
    await expect(productCard.addToCart.quantityInput).toHaveValue(String(QUANTITY_PRODUCT.stock));
    await expect(productCard.addToCart.quantityError).toBeHidden();
    await expect(productCard.addToCart.addToCartButton).toBeEnabled();
  });

  test("validates and recovers out-of-range manual quantities", async () => {
    const productCard = catalogPage.getProductCard(QUANTITY_PRODUCT.title);
    const excessiveQuantity = QUANTITY_PRODUCT.stock + 10;

    await expect(productCard.addToCart.quantityInput).toHaveValue("1");

    await test.step("recover from a quantity below the minimum", async () => {
      await productCard.addToCart.fillQuantity("0");

      await expect(productCard.addToCart.quantityInput).toHaveValue("0");
      await expect(productCard.addToCart.quantityError).toBeVisible();
      await expect(productCard.addToCart.quantityError).toHaveText("Quantity must be at least 1.");
      await expect(productCard.addToCart.quantityError).toHaveRole("alert");
      await expect(productCard.addToCart.quantityInput).toHaveAttribute("aria-invalid", "true");
      await expect(productCard.addToCart.decreaseButton).toBeDisabled();
      await expect(productCard.addToCart.increaseButton).toBeEnabled();
      await expect(productCard.addToCart.addToCartButton).toBeDisabled();

      await productCard.addToCart.increaseQuantity();

      await expect(productCard.addToCart.quantityInput).toHaveValue("1");
      await expect(productCard.addToCart.quantityError).toBeHidden();
      await expect(productCard.addToCart.quantityInput).toHaveAttribute("aria-invalid", "false");
      await expect(productCard.addToCart.decreaseButton).toBeDisabled();
      await expect(productCard.addToCart.increaseButton).toBeEnabled();
      await expect(productCard.addToCart.addToCartButton).toBeEnabled();
    });

    await test.step("recover from a quantity above available stock", async () => {
      await productCard.addToCart.fillQuantity(String(excessiveQuantity));

      await expect(productCard.addToCart.quantityInput).toHaveValue(String(excessiveQuantity));
      await expect(productCard.addToCart.quantityError).toBeVisible();
      await expect(productCard.addToCart.quantityError).toHaveText(
        `Only ${QUANTITY_PRODUCT.stock} items are available to add.`,
      );
      await expect(productCard.addToCart.quantityError).toHaveRole("alert");
      await expect(productCard.addToCart.quantityInput).toHaveAttribute("aria-invalid", "true");
      await expect(productCard.addToCart.decreaseButton).toBeEnabled();
      await expect(productCard.addToCart.increaseButton).toBeDisabled();
      await expect(productCard.addToCart.addToCartButton).toBeDisabled();

      await productCard.addToCart.decreaseQuantity();

      await expect(productCard.addToCart.quantityInput).toHaveValue(String(QUANTITY_PRODUCT.stock));
      await expect(productCard.addToCart.quantityError).toBeHidden();
      await expect(productCard.addToCart.quantityInput).toHaveAttribute("aria-invalid", "false");
      await expect(productCard.addToCart.decreaseButton).toBeEnabled();
      await expect(productCard.addToCart.increaseButton).toBeDisabled();
      await expect(productCard.addToCart.addToCartButton).toBeEnabled();
    });
  });

  test("prevents purchasing an out-of-stock product", async () => {
    const productCard = catalogPage.getProductCard(OUT_OF_STOCK_PRODUCT.title);

    await expect(productCard.addToCart.quantityInput).toBeDisabled();
    await expect(productCard.addToCart.decreaseButton).toBeDisabled();
    await expect(productCard.addToCart.increaseButton).toBeDisabled();
    await expect(productCard.addToCart.addToCartButton).toBeDisabled();

    await expect(productCard.addToCart.productAvailability).toContainText(
      "No more items available",
    );
    await expect(productCard.addToCart.quantityHint).toHaveText(
      "This product cannot be added right now.",
    );

    await expect(productCard.addToCart.quantityInput).toHaveAttribute("aria-invalid", "false");
    await expect(productCard.addToCart.quantityError).toBeHidden();
  });

  test("handles pasted quantity values", async ({ browserName, context }) => {
    // Chromium-only: this scenario requires browser clipboard permissions.
    test.skip(
      browserName !== "chromium",
      "Clipboard-based paste is supported only in the Chromium project.",
    );

    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    const productCard = catalogPage.getProductCard(QUANTITY_PRODUCT.title);

    await productCard.addToCart.pasteQuantity("3");
    await expect(productCard.addToCart.quantityInput).toHaveValue("3");

    await productCard.addToCart.pasteQuantity("-4");
    await expect(productCard.addToCart.quantityInput).toHaveValue("3");

    await productCard.addToCart.pasteQuantity("1.5");
    await expect(productCard.addToCart.quantityInput).toHaveValue("3");
  });
});
