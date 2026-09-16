import { ToastComponent } from "../../src/components";
import { expect, test } from "../../src/fixtures";
import {
  prepareMockedAuthenticatedSession,
  prepareProductCatalog,
  prepareProductDetails,
} from "../../src/helpers";
import { ProductCatalogPage, ProductDetailsPage } from "../../src/pages";
import {
  ADD_TO_CART_PRODUCT_A,
  ADD_TO_CART_PRODUCT_B,
  REGULAR_USER,
  SINGLE_STOCK_PRODUCT,
  createProduct,
} from "../../src/test-data";

test.describe("add to cart", () => {
  let catalogPage: ProductCatalogPage;
  let productDetailsPage: ProductDetailsPage;
  let toast: ToastComponent;

  test.beforeEach(async ({ page }) => {
    await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);

    catalogPage = new ProductCatalogPage(page);
    productDetailsPage = new ProductDetailsPage(page);
    toast = new ToastComponent(page);
  });

  test("adds and merges repeated quantities from product details", async ({ page }) => {
    const product = createProduct(ADD_TO_CART_PRODUCT_A);
    const quantityPerAddition = 2;

    await prepareProductDetails(page, product);
    await productDetailsPage.open(product.id);

    await test.step("add the selected quantity", async () => {
      await productDetailsPage.addToCart.fillQuantity(String(quantityPerAddition));
      await productDetailsPage.addToCart.submit();

      await expect(toast.message).toHaveText(`${product.title} added to cart.`);
      await expect(productDetailsPage.header.cartLink).toHaveAccessibleName(
        `Cart, ${quantityPerAddition} items`,
      );
      await expect(productDetailsPage.addToCart.inCart).toHaveText(
        `In cart: ${quantityPerAddition}`,
      );
      await expect(productDetailsPage.addToCart.available).toHaveText(
        `Available: ${product.stock - quantityPerAddition}`,
      );
      await expect(productDetailsPage.addToCart.quantityInput).toHaveValue("1");
      await expect(productDetailsPage.addToCart.quantityHint).toHaveText(
        `Choose a quantity from 1 to ${product.stock - quantityPerAddition}.`,
      );
    });

    await test.step("merge a repeated addition of the same product", async () => {
      // The repeated addition shows the same message, so close the first toast
      // to make sure the next assertion observes a new notification.
      await toast.close();

      await productDetailsPage.addToCart.fillQuantity(String(quantityPerAddition));
      await productDetailsPage.addToCart.submit();

      const expectedQuantityInCart = quantityPerAddition * 2;
      const expectedAvailableQuantity = product.stock - expectedQuantityInCart;

      await expect(toast.message).toHaveText(`${product.title} added to cart.`);
      await expect(productDetailsPage.header.cartLink).toHaveAccessibleName(
        `Cart, ${expectedQuantityInCart} items`,
      );
      await expect(productDetailsPage.addToCart.inCart).toHaveText(
        `In cart: ${expectedQuantityInCart}`,
      );
      await expect(productDetailsPage.addToCart.available).toHaveText(
        `Available: ${expectedAvailableQuantity}`,
      );
      await expect(productDetailsPage.addToCart.quantityInput).toHaveValue("1");
      await expect(productDetailsPage.addToCart.quantityHint).toHaveText(
        "Only 1 item can be added.",
      );
    });
  });

  test("exhausts the last available item after adding it", async ({ page }) => {
    const product = createProduct(SINGLE_STOCK_PRODUCT);

    await prepareProductDetails(page, product);
    await productDetailsPage.open(product.id);

    await expect(productDetailsPage.addToCart.available).toHaveText("Available: 1");
    await expect(productDetailsPage.addToCart.inCart).toHaveCount(0);
    await expect(productDetailsPage.addToCart.quantityInput).toHaveValue("1");
    await expect(productDetailsPage.addToCart.quantityHint).toHaveText("Only 1 item can be added.");
    await expect(productDetailsPage.addToCart.addToCartButton).toBeEnabled();

    await productDetailsPage.addToCart.submit();

    await expect(toast.message).toHaveText(`${product.title} added to cart.`);
    await expect(productDetailsPage.header.cartLink).toHaveAccessibleName("Cart, 1 item");
    await expect(productDetailsPage.addToCart.inCart).toHaveText("In cart: 1");
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
  });

  test("shares cart state between catalog cards and product details", async ({ page }) => {
    const productA = createProduct(ADD_TO_CART_PRODUCT_A);
    const productB = createProduct(ADD_TO_CART_PRODUCT_B);

    const productAQuantity = 2;
    const productBQuantity = 1;
    const additionalProductAQuantity = 1;

    await prepareProductCatalog(page, [productA, productB]);
    await prepareProductDetails(page, productA);
    await catalogPage.open();

    const productACard = catalogPage.getProductCard(productA.title);
    const productBCard = catalogPage.getProductCard(productB.title);

    await test.step(`add ${productAQuantity} units from the correct catalog card`, async () => {
      await expect(productACard.title).toBeVisible();
      await expect(productBCard.title).toBeVisible();

      await productACard.addToCart.fillQuantity(String(productAQuantity));
      await productACard.addToCart.submit();

      await expect(toast.message).toHaveText(`${productA.title} added to cart.`);
      await expect(productACard.addToCart.inCart).toHaveText(`In cart: ${productAQuantity}`);
      await expect(productBCard.addToCart.inCart).toHaveCount(0);
      await expect(catalogPage.header.cartLink).toHaveAccessibleName(
        `Cart, ${productAQuantity} items`,
      );
    });

    await test.step(`add ${productBQuantity} unit from a different catalog card`, async () => {
      await productBCard.addToCart.fillQuantity(String(productBQuantity));
      await productBCard.addToCart.submit();

      const expectedCartQuantity = productAQuantity + productBQuantity;

      await expect(toast.message).toHaveText(`${productB.title} added to cart.`);
      await expect(productACard.addToCart.inCart).toHaveText(`In cart: ${productAQuantity}`);
      await expect(productBCard.addToCart.inCart).toHaveText(`In cart: ${productBQuantity}`);
      await expect(catalogPage.header.cartLink).toHaveAccessibleName(
        `Cart, ${expectedCartQuantity} items`,
      );
    });

    await test.step(`open ${productA.title} and preserve its individual cart state`, async () => {
      await productACard.openDetails();

      await expect(page).toHaveURL(`/products/${productA.id}`);
      await expect(productDetailsPage.heading).toHaveText(productA.title);
      await expect(productDetailsPage.addToCart.inCart).toHaveText(`In cart: ${productAQuantity}`);
      await expect(productDetailsPage.addToCart.available).toHaveText(
        `Available: ${productA.stock - productAQuantity}`,
      );
      await expect(productDetailsPage.header.cartLink).toHaveAccessibleName(
        `Cart, ${productAQuantity + productBQuantity} items`,
      );
    });

    await test.step(`add ${additionalProductAQuantity} more unit from product details`, async () => {
      await productDetailsPage.addToCart.fillQuantity(String(additionalProductAQuantity));
      await productDetailsPage.addToCart.submit();

      const expectedProductAQuantity = productAQuantity + additionalProductAQuantity;
      const expectedCartQuantity = expectedProductAQuantity + productBQuantity;

      await expect(toast.message).toHaveText(`${productA.title} added to cart.`);
      await expect(productDetailsPage.addToCart.inCart).toHaveText(
        `In cart: ${expectedProductAQuantity}`,
      );
      await expect(productDetailsPage.addToCart.available).toHaveText(
        `Available: ${productA.stock - expectedProductAQuantity}`,
      );
      await expect(productDetailsPage.header.cartLink).toHaveAccessibleName(
        `Cart, ${expectedCartQuantity} items`,
      );
    });
  });
});
