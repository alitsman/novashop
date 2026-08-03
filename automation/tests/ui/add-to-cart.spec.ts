import { test, expect } from "@playwright/test";
import {
  CartPage,
  ProductCatalogPage,
  ProductDetailsPage,
} from "../../src/pages";
import { HeaderComponent, ToastComponent } from "../../src/components";
import { authenticateUser, prepareProductCatalog } from "../../src/helpers";
import {
  REGULAR_USER,
  ADD_TO_CART_PRODUCT_A,
  ADD_TO_CART_PRODUCT_B,
  ADD_TO_CART_PRODUCTS,
  createProduct,
} from "../../src/test-data";

const TOAST_AUTO_DISMISS_TIMEOUT_MS = 8_000;

function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

test.describe("add to cart", () => {
  let catalogPage: ProductCatalogPage;
  let cartPage: CartPage;
  let toast: ToastComponent;
  let header: HeaderComponent;

  test.beforeEach(async ({ page }) => {
    await authenticateUser(page, REGULAR_USER);

    const catalogProducts = ADD_TO_CART_PRODUCTS.map((product) =>
      createProduct(product),
    );

    await prepareProductCatalog(page, catalogProducts);

    catalogPage = new ProductCatalogPage(page);
    cartPage = new CartPage(page);
    toast = new ToastComponent(page);
    header = new HeaderComponent(page);

    await catalogPage.open();
  });

  test("adds the selected quantity from a catalog card and reflects it in the catalog", async ({
    page,
  }) => {
    const product = ADD_TO_CART_PRODUCT_A;
    const quantityToAdd = 3;

    const expectedAvailableQuantity = product.stock - quantityToAdd;
    const expectedItemTotal = product.price * quantityToAdd;

    const productCard = catalogPage.getProductCard(product.title);

    await test.step(`Add ${quantityToAdd} units of ${product.title} from the catalog`, async () => {
      await productCard.addToCart.fillQuantity(String(quantityToAdd));
      await productCard.addToCart.submit();
    });

    await test.step("Verify the notification and updated cart state", async () => {
      await expect(toast.message).toHaveText(`${product.title} added to cart.`);
      await expect(productCard.addToCart.quantityInput).toHaveValue("1");

      await toast.close();

      await expect(toast.message).toBeEmpty();
      await expect(toast.closeButton).toHaveCount(0);

      await expect(header.cartLink).toHaveAccessibleName(
        `Cart, ${quantityToAdd} items`,
      );
    });

    await test.step("Open the cart and verify its contents and totals", async () => {
      await header.openCart();

      await expect(page).toHaveURL("/cart");
      await expect(cartPage.heading).toHaveText("Cart");
      await expect(cartPage.cartItems).toHaveCount(1);

      const cartItem = cartPage.getCartItem(product.title);

      await expect(cartItem.title).toHaveText(product.title);
      await expect(cartItem.quantityInput).toHaveValue(String(quantityToAdd));
      await expect(cartItem.price).toHaveText(
        `Price: ${formatUsd(product.price)}`,
      );
      await expect(cartItem.itemTotal).toHaveText(
        `Item total: ${formatUsd(expectedItemTotal)}`,
      );

      await expect(cartPage.summaryQuantity).toHaveText(
        `${quantityToAdd} items in cart`,
      );
      await expect(cartPage.summaryTotal).toHaveText(
        `Total: ${formatUsd(expectedItemTotal)}`,
      );
    });

    await test.step("Return to the catalog and verify the updated product state", async () => {
      await cartPage.continueShoppingLink.click();

      await expect(page).toHaveURL("/products");
      await expect(productCard.addToCart.available).toHaveText(
        `Available: ${expectedAvailableQuantity}`,
      );
      await expect(productCard.addToCart.inCart).toHaveText(
        `In cart: ${quantityToAdd}`,
      );
    });
  });

  test("adds the selected quantity from product details and updates the page state", async ({
    page,
  }) => {
    const productDetailsPage = new ProductDetailsPage(page);
    const product = ADD_TO_CART_PRODUCT_A;
    const quantityToAdd = 2;

    const expectedAvailableQuantity = product.stock - quantityToAdd;

    const productCard = catalogPage.getProductCard(product.title);

    await test.step("Open product details and verify the initial state", async () => {
      await productCard.openDetails();

      await expect(page).toHaveURL(`/products/${product.id}`);

      await expect(productDetailsPage.heading).toHaveText(product.title);
      await expect(productDetailsPage.description).toHaveText(
        product.description,
      );
      await expect(productDetailsPage.category).toHaveText(product.category);
      await expect(productDetailsPage.price).toHaveText(
        formatUsd(product.price),
      );

      await expect(productDetailsPage.addToCart.available).toHaveText(
        `Available: ${product.stock}`,
      );
      await expect(productDetailsPage.addToCart.inCart).toHaveCount(0);
      await expect(productDetailsPage.addToCart.quantityInput).toHaveValue("1");
      await expect(productDetailsPage.addToCart.quantityHint).toHaveText(
        `Choose a quantity from 1 to ${product.stock}.`,
      );
    });

    await test.step(`Add ${quantityToAdd} units of ${product.title} from product details`, async () => {
      await productDetailsPage.addToCart.fillQuantity(String(quantityToAdd));
      await productDetailsPage.addToCart.submit();
    });

    await test.step("Verify the notification and updated product state", async () => {
      await expect(toast.message).toHaveText(`${product.title} added to cart.`);

      await expect(productDetailsPage.addToCart.available).toHaveText(
        `Available: ${expectedAvailableQuantity}`,
      );
      await expect(productDetailsPage.addToCart.inCart).toHaveText(
        `In cart: ${quantityToAdd}`,
      );
      await expect(productDetailsPage.addToCart.quantityInput).toHaveValue("1");
      await expect(productDetailsPage.addToCart.quantityHint).toHaveText(
        `Choose a quantity from 1 to ${expectedAvailableQuantity}.`,
      );
    });

    await test.step("Verify the notification is automatically dismissed", async () => {
      await expect(toast.message).toBeEmpty({
        timeout: TOAST_AUTO_DISMISS_TIMEOUT_MS,
      });
      await expect(toast.closeButton).toHaveCount(0);
    });

    await test.step("Open the cart and verify the added product quantity", async () => {
      await expect(header.cartLink).toHaveAccessibleName(
        `Cart, ${quantityToAdd} items`,
      );

      await header.openCart();

      await expect(page).toHaveURL("/cart");
      await expect(cartPage.cartItems).toHaveCount(1);

      const cartItem = cartPage.getCartItem(product.title);

      await expect(cartItem.title).toHaveText(product.title);
      await expect(cartItem.quantityInput).toHaveValue(String(quantityToAdd));
    });
  });

  test("merges repeated additions of the same product and preserves its state across entry points", async ({
    page,
  }) => {
    const productDetailsPage = new ProductDetailsPage(page);
    const product = ADD_TO_CART_PRODUCT_A;
    const quantityPerAddition = 2;
    const expectedQuantityInCart = quantityPerAddition * 2;
    const expectedAvailableQuantity = product.stock - expectedQuantityInCart;
    const expectedItemTotal = product.price * expectedQuantityInCart;

    const productCard = catalogPage.getProductCard(product.title);

    await test.step(`Add ${quantityPerAddition} units of ${product.title} from the catalog`, async () => {
      await productCard.addToCart.fillQuantity(String(quantityPerAddition));
      await productCard.addToCart.submit();

      await expect(productCard.addToCart.available).toHaveText(
        `Available: ${product.stock - quantityPerAddition}`,
      );
      await expect(productCard.addToCart.inCart).toHaveText(
        `In cart: ${quantityPerAddition}`,
      );
    });

    await test.step("Open product details and verify that the cart state is preserved", async () => {
      await productCard.openDetails();

      await expect(page).toHaveURL(`/products/${product.id}`);
      await expect(productDetailsPage.heading).toHaveText(product.title);
      await expect(productDetailsPage.addToCart.available).toHaveText(
        `Available: ${product.stock - quantityPerAddition}`,
      );
      await expect(productDetailsPage.addToCart.inCart).toHaveText(
        `In cart: ${quantityPerAddition}`,
      );
    });

    await test.step(`Add ${quantityPerAddition} more units from product details`, async () => {
      await productDetailsPage.addToCart.fillQuantity(
        String(quantityPerAddition),
      );
      await productDetailsPage.addToCart.submit();

      await expect(productDetailsPage.addToCart.available).toHaveText(
        `Available: ${expectedAvailableQuantity}`,
      );
      await expect(productDetailsPage.addToCart.inCart).toHaveText(
        `In cart: ${expectedQuantityInCart}`,
      );
      await expect(productDetailsPage.addToCart.quantityInput).toHaveValue("1");

      await expect(header.cartLink).toHaveAccessibleName(
        `Cart, ${expectedQuantityInCart} items`,
      );
    });

    await test.step("Open the cart and verify that both additions were merged", async () => {
      await header.openCart();

      await expect(page).toHaveURL("/cart");
      await expect(cartPage.cartItems).toHaveCount(1);

      const cartItem = cartPage.getCartItem(product.title);

      await expect(cartItem.title).toHaveText(product.title);
      await expect(cartItem.quantityInput).toHaveValue(
        String(expectedQuantityInCart),
      );
      await expect(cartItem.itemTotal).toHaveText(
        `Item total: ${formatUsd(expectedItemTotal)}`,
      );
    });
  });

  test("preserves different products added from the catalog and product details", async ({
    page,
  }) => {
    const productDetailsPage = new ProductDetailsPage(page);

    const productA = ADD_TO_CART_PRODUCT_A;
    const productB = ADD_TO_CART_PRODUCT_B;

    const productAQuantity = 2;
    const productBQuantity = 1;
    const expectedCartQuantity = productAQuantity + productBQuantity;

    const expectedProductATotal = productA.price * productAQuantity;
    const expectedProductBTotal = productB.price * productBQuantity;
    const expectedCartTotal = expectedProductATotal + expectedProductBTotal;

    const productACard = catalogPage.getProductCard(productA.title);
    const productBCard = catalogPage.getProductCard(productB.title);

    await test.step(`Add ${productAQuantity} units of ${productA.title} from the catalog`, async () => {
      await productACard.addToCart.fillQuantity(String(productAQuantity));
      await productACard.addToCart.submit();

      await expect(header.cartLink).toHaveAccessibleName(
        `Cart, ${productAQuantity} items`,
      );
    });

    await test.step(`Open the details for ${productB.title} and add ${productBQuantity} unit`, async () => {
      await productBCard.openDetails();

      await expect(page).toHaveURL(`/products/${productB.id}`);
      await expect(productDetailsPage.heading).toHaveText(productB.title);

      await productDetailsPage.addToCart.fillQuantity(String(productBQuantity));
      await productDetailsPage.addToCart.submit();

      await expect(header.cartLink).toHaveAccessibleName(
        `Cart, ${expectedCartQuantity} items`,
      );
    });

    await test.step("Open the cart and verify that both products are preserved", async () => {
      await header.openCart();

      await expect(page).toHaveURL("/cart");
      await expect(cartPage.cartItems).toHaveCount(2);

      const productACartItem = cartPage.getCartItem(productA.title);
      const productBCartItem = cartPage.getCartItem(productB.title);

      await expect(productACartItem.title).toHaveText(productA.title);
      await expect(productACartItem.quantityInput).toHaveValue(
        String(productAQuantity),
      );
      await expect(productACartItem.itemTotal).toHaveText(
        `Item total: ${formatUsd(expectedProductATotal)}`,
      );

      await expect(productBCartItem.title).toHaveText(productB.title);
      await expect(productBCartItem.quantityInput).toHaveValue(
        String(productBQuantity),
      );
      await expect(productBCartItem.itemTotal).toHaveText(
        `Item total: ${formatUsd(expectedProductBTotal)}`,
      );
    });

    await test.step("Verify the combined cart quantity and total", async () => {
      await expect(cartPage.summaryQuantity).toHaveText(
        `${expectedCartQuantity} items in cart`,
      );
      await expect(cartPage.summaryTotal).toHaveText(
        `Total: ${formatUsd(expectedCartTotal)}`,
      );
    });
  });
});
