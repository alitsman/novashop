import { apiUrl } from "../../src/config/playwright.shared";
import { ToastComponent } from "../../src/components";
import { expect, test } from "../../src/fixtures";
import {
  holdProductCatalogUntilReleased,
  prepareCart,
  prepareMockedAuthenticatedSession,
  prepareProductCatalog,
  prepareProductCatalogNetworkFailure,
} from "../../src/helpers";
import { CheckoutPage, ProductCatalogPage } from "../../src/pages";
import { apiErrorResponseSchema } from "../../src/schemas";
import { CART_PRODUCT_A, CART_PRODUCT_B, REGULAR_USER, createCartItem } from "../../src/test-data";
import { DeliveryMethod, PaymentMethod } from "../../src/types";
import { formatUsd } from "../../src/utils";

const ORDERS_API_URL = new URL("/orders", apiUrl).toString();

const VALID_FULL_NAME = "Test Customer";
const UPDATED_FULL_NAME = "Updated Customer";
const VALID_PHONE = "+995 555 010101";
const VALID_ADDRESS = "12 Test Street";

const CREATE_ORDER_ERROR_RESPONSE = apiErrorResponseSchema.parse({
  error: {
    code: "INSUFFICIENT_STOCK",
    message: "Insufficient stock",
    details: {
      productId: CART_PRODUCT_A.id,
      requestedQuantity: 2,
      availableStock: 1,
    },
  },
});

test.describe("checkout", () => {
  let checkoutPage: CheckoutPage;
  let createOrderRequestCount: number;

  test.beforeEach(async ({ page }) => {
    await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);

    checkoutPage = new CheckoutPage(page);
    createOrderRequestCount = 0;

    page.on("request", (request) => {
      if (request.url() === ORDERS_API_URL && request.method() === "POST") {
        createOrderRequestCount += 1;
      }
    });
  });

  test("shows the empty-checkout state and lets the user return to products", async ({ page }) => {
    await checkoutPage.open();

    await expect(page).toHaveURL("/checkout");
    await expect(checkoutPage.heading).toBeVisible();
    await expect(checkoutPage.header.cartLink).toHaveAccessibleName("Cart, 0 items");
    await expect(checkoutPage.emptyCartTitle).toBeVisible();
    await expect(checkoutPage.orderSummaryBlock).toHaveCount(0);
    await expect(checkoutPage.form).toHaveCount(0);
    await expect(checkoutPage.submitButton).toHaveCount(0);

    await checkoutPage.goToProductsLink.click();

    await expect(page).toHaveURL("/products");
  });

  test("blocks ordering while checking the cart and uses current data after reopening", async ({
    page,
  }) => {
    const seedCartItemA = {
      ...createCartItem(CART_PRODUCT_A, { quantity: 1 }),
      price: 9.99,
    };
    const seedCartItemB = {
      ...createCartItem(CART_PRODUCT_B, { quantity: 2 }),
      price: 14.99,
    };
    const initialCatalogProductA = { ...CART_PRODUCT_A, price: 39.99 };
    const initialCatalogProductB = { ...CART_PRODUCT_B, price: 24.99 };
    const reopenedCatalogProductA = { ...CART_PRODUCT_A, price: 59.99 };
    const reopenedCatalogProductB = { ...CART_PRODUCT_B, price: 34.99 };

    const heldProductCatalogRequest = await holdProductCatalogUntilReleased(page, [
      initialCatalogProductA,
      initialCatalogProductB,
    ]);

    await prepareCart(page, REGULAR_USER.user.id, [seedCartItemA, seedCartItemB]);

    const orderItemA = checkoutPage.getOrderItem(seedCartItemA.title);
    const orderItemB = checkoutPage.getOrderItem(seedCartItemB.title);
    const initialTotal =
      initialCatalogProductA.price * seedCartItemA.quantity +
      initialCatalogProductB.price * seedCartItemB.quantity;
    const reopenedTotal =
      reopenedCatalogProductA.price * seedCartItemA.quantity +
      reopenedCatalogProductB.price * seedCartItemB.quantity;
    const totalQuantity = seedCartItemA.quantity + seedCartItemB.quantity;

    try {
      await Promise.all([checkoutPage.open(), heldProductCatalogRequest.requestObserved]);

      await expect(page).toHaveURL("/checkout");
      await expect(checkoutPage.heading).toBeVisible();
      await expect(checkoutPage.orderSummaryBlock).toBeVisible();
      await expect(checkoutPage.form).toBeVisible();
      await expect(checkoutPage.orderItems).toHaveCount(2);
      await expect(checkoutPage.orderItems.nth(0)).toContainText(seedCartItemA.title);
      await expect(checkoutPage.orderItems.nth(1)).toContainText(seedCartItemB.title);

      await expect(checkoutPage.submitButton).toBeDisabled();
      await expect(checkoutPage.submitButton).toHaveAttribute("aria-busy", "true");

      heldProductCatalogRequest.release();

      await expect(checkoutPage.submitButton).toBeEnabled();
      await expect(checkoutPage.submitButton).toHaveAttribute("aria-busy", "false");

      await expect(orderItemA).toContainText(
        `${seedCartItemA.quantity} item × ${formatUsd(initialCatalogProductA.price)}`,
      );
      await expect(orderItemB).toContainText(
        `${seedCartItemB.quantity} items × ${formatUsd(initialCatalogProductB.price)}`,
      );
      await expect(checkoutPage.getOrderItemTotal(seedCartItemA.title)).toHaveText(
        formatUsd(initialCatalogProductA.price * seedCartItemA.quantity),
      );
      await expect(checkoutPage.getOrderItemTotal(seedCartItemB.title)).toHaveText(
        formatUsd(initialCatalogProductB.price * seedCartItemB.quantity),
      );
      await expect(checkoutPage.summaryQuantity).toHaveText(`${totalQuantity} items in cart`);
      await expect(checkoutPage.summaryTotal).toHaveText(`Total: ${formatUsd(initialTotal)}`);
      await expect(checkoutPage.header.cartLink).toHaveAccessibleName(
        `Cart, ${totalQuantity} items`,
      );
    } finally {
      await heldProductCatalogRequest.dispose();
    }

    // Catalog prices change before Checkout is reopened,
    // so the reopened page must show current prices without changing saved quantities.
    await prepareProductCatalog(page, [reopenedCatalogProductA, reopenedCatalogProductB]);
    await page.reload();

    await expect(orderItemA).toContainText(
      `${seedCartItemA.quantity} item × ${formatUsd(reopenedCatalogProductA.price)}`,
    );
    await expect(orderItemB).toContainText(
      `${seedCartItemB.quantity} items × ${formatUsd(reopenedCatalogProductB.price)}`,
    );
    await expect(checkoutPage.getOrderItemTotal(seedCartItemA.title)).toHaveText(
      formatUsd(reopenedCatalogProductA.price * seedCartItemA.quantity),
    );
    await expect(checkoutPage.getOrderItemTotal(seedCartItemB.title)).toHaveText(
      formatUsd(reopenedCatalogProductB.price * seedCartItemB.quantity),
    );
    await expect(checkoutPage.summaryQuantity).toHaveText(`${totalQuantity} items in cart`);
    await expect(checkoutPage.summaryTotal).toHaveText(`Total: ${formatUsd(reopenedTotal)}`);
    await expect(checkoutPage.header.cartLink).toHaveAccessibleName(`Cart, ${totalQuantity} items`);
    await expect(checkoutPage.submitButton).toBeEnabled();

    await checkoutPage.backToCartLink.click();

    await expect(page).toHaveURL("/cart");
  });

  test("shows required-field errors and focuses the first invalid field", async ({ page }) => {
    const seedCartItem = createCartItem(CART_PRODUCT_A);

    await prepareProductCatalog(page, [CART_PRODUCT_A]);

    // Checkout renders the form only when the cart is not empty.
    await prepareCart(page, REGULAR_USER.user.id, [seedCartItem]);

    await checkoutPage.open();
    await expect(checkoutPage.submitButton).toBeEnabled();

    await checkoutPage.submitButton.click();

    await expect(checkoutPage.formError).toHaveText(
      "Please fix the highlighted fields before placing your order.",
    );

    await expect(checkoutPage.fullNameInput).toHaveAccessibleDescription("Full name is required.");
    await expect(checkoutPage.fullNameInput).toHaveAttribute("aria-invalid", "true");

    await expect(checkoutPage.phoneInput).toHaveAccessibleDescription("Phone number is required.");
    await expect(checkoutPage.phoneInput).toHaveAttribute("aria-invalid", "true");

    await expect(checkoutPage.addressInput).toHaveAccessibleDescription(
      "Delivery address is required.",
    );
    await expect(checkoutPage.addressInput).toHaveAttribute("aria-invalid", "true");

    await expect(checkoutPage.fullNameInput).toBeFocused();

    await checkoutPage.fullNameInput.fill(VALID_FULL_NAME);
    await checkoutPage.submitButton.click();

    await expect(checkoutPage.phoneInput).toBeFocused();

    await checkoutPage.phoneInput.fill(VALID_PHONE);
    await checkoutPage.submitButton.click();

    await expect(checkoutPage.addressInput).toBeFocused();

    expect(createOrderRequestCount).toBe(0);
  });

  test("clears field errors as the user corrects the form", async ({ page }) => {
    await prepareProductCatalog(page, [CART_PRODUCT_A]);
    await prepareCart(page, REGULAR_USER.user.id, [createCartItem(CART_PRODUCT_A)]);

    await checkoutPage.open();
    await expect(checkoutPage.submitButton).toBeEnabled();

    await checkoutPage.submitButton.click();

    await expect(checkoutPage.formError).toHaveText(
      "Please fix the highlighted fields before placing your order.",
    );

    await checkoutPage.fullNameInput.fill(VALID_FULL_NAME);

    await expect(checkoutPage.fullNameInput).toHaveAccessibleDescription("");
    await expect(checkoutPage.fullNameInput).toHaveAttribute("aria-invalid", "false");
    await expect(checkoutPage.phoneInput).toHaveAccessibleDescription("Phone number is required.");
    await expect(checkoutPage.addressInput).toHaveAccessibleDescription(
      "Delivery address is required.",
    );
    await expect(checkoutPage.formError).toHaveText(
      "Please fix the highlighted fields before placing your order.",
    );

    await checkoutPage.phoneInput.fill(VALID_PHONE);

    await expect(checkoutPage.phoneInput).toHaveAccessibleDescription("");
    await expect(checkoutPage.phoneInput).toHaveAttribute("aria-invalid", "false");
    await expect(checkoutPage.addressInput).toHaveAccessibleDescription(
      "Delivery address is required.",
    );
    await expect(checkoutPage.formError).toHaveText(
      "Please fix the highlighted fields before placing your order.",
    );

    await checkoutPage.addressInput.fill(VALID_ADDRESS);

    await expect(checkoutPage.addressInput).toHaveAccessibleDescription("");
    await expect(checkoutPage.addressInput).toHaveAttribute("aria-invalid", "false");
    await expect(checkoutPage.formError).toBeHidden();

    expect(createOrderRequestCount).toBe(0);
  });

  test("preserves customer details when delivery and payment methods change", async ({ page }) => {
    await prepareProductCatalog(page, [CART_PRODUCT_A]);
    await prepareCart(page, REGULAR_USER.user.id, [createCartItem(CART_PRODUCT_A)]);

    await checkoutPage.open();
    await expect(checkoutPage.submitButton).toBeEnabled();

    await expect(checkoutPage.deliveryMethodSelect).toHaveValue(DeliveryMethod.Standard);
    await expect(checkoutPage.paymentMethodSelect).toHaveValue(PaymentMethod.Cash);

    await checkoutPage.fullNameInput.fill(VALID_FULL_NAME);
    await checkoutPage.phoneInput.fill(VALID_PHONE);
    await checkoutPage.addressInput.fill(VALID_ADDRESS);

    await checkoutPage.deliveryMethodSelect.selectOption(DeliveryMethod.Express);
    await checkoutPage.paymentMethodSelect.selectOption(PaymentMethod.Card);

    await expect(checkoutPage.deliveryMethodSelect).toHaveValue(DeliveryMethod.Express);
    await expect(checkoutPage.paymentMethodSelect).toHaveValue(PaymentMethod.Card);
    await expect(checkoutPage.fullNameInput).toHaveValue(VALID_FULL_NAME);
    await expect(checkoutPage.phoneInput).toHaveValue(VALID_PHONE);
    await expect(checkoutPage.addressInput).toHaveValue(VALID_ADDRESS);
  });

  test("requires another submission after catalog prices change", async ({ page }) => {
    const seedCartItem = createCartItem(CART_PRODUCT_A, { quantity: 2 });
    const updatedCatalogProduct = { ...CART_PRODUCT_A, price: 59.99 };

    await prepareProductCatalog(page, [CART_PRODUCT_A]);
    await prepareCart(page, REGULAR_USER.user.id, [seedCartItem]);

    await checkoutPage.open();
    await expect(checkoutPage.submitButton).toBeEnabled();

    await checkoutPage.fullNameInput.fill(VALID_FULL_NAME);
    await checkoutPage.phoneInput.fill(VALID_PHONE);
    await checkoutPage.addressInput.fill(VALID_ADDRESS);
    await checkoutPage.deliveryMethodSelect.selectOption(DeliveryMethod.Express);
    await checkoutPage.paymentMethodSelect.selectOption(PaymentMethod.Card);

    // The later route represents a catalog price change before submission.
    await prepareProductCatalog(page, [updatedCatalogProduct]);

    await checkoutPage.submitButton.click();

    await expect(page).toHaveURL("/checkout");
    await expect(checkoutPage.formError).toHaveText(
      "Prices have changed. Review the updated total and place your order again.",
    );
    await expect(checkoutPage.getOrderItemTotal(seedCartItem.title)).toHaveText(
      formatUsd(updatedCatalogProduct.price * seedCartItem.quantity),
    );
    await expect(checkoutPage.summaryTotal).toHaveText(
      `Total: ${formatUsd(updatedCatalogProduct.price * seedCartItem.quantity)}`,
    );
    await expect(checkoutPage.fullNameInput).toHaveValue(VALID_FULL_NAME);
    await expect(checkoutPage.phoneInput).toHaveValue(VALID_PHONE);
    await expect(checkoutPage.addressInput).toHaveValue(VALID_ADDRESS);
    await expect(checkoutPage.deliveryMethodSelect).toHaveValue(DeliveryMethod.Express);
    await expect(checkoutPage.paymentMethodSelect).toHaveValue(PaymentMethod.Card);
    await expect(checkoutPage.submitButton).toBeEnabled();

    expect(createOrderRequestCount).toBe(0);

    // The order request has no mock on purpose: only the fact that the second
    // submission reaches the API matters here.
    const createOrderRequestPromise = page.waitForRequest(
      (request) => request.url() === ORDERS_API_URL && request.method() === "POST",
    );

    await Promise.all([checkoutPage.submitButton.click(), createOrderRequestPromise]);
  });

  test("blocks ordering when current stock is below the saved quantity", async ({ page }) => {
    const seedCartItem = createCartItem(CART_PRODUCT_A, { quantity: 3 });
    const reducedStockProduct = { ...CART_PRODUCT_A, stock: 2 };

    await prepareProductCatalog(page, [CART_PRODUCT_A]);
    await prepareCart(page, REGULAR_USER.user.id, [seedCartItem]);

    await checkoutPage.open();
    await expect(checkoutPage.submitButton).toBeEnabled();

    await checkoutPage.fullNameInput.fill(VALID_FULL_NAME);
    await checkoutPage.phoneInput.fill(VALID_PHONE);
    await checkoutPage.addressInput.fill(VALID_ADDRESS);

    // The later route represents stock changing before submission.
    await prepareProductCatalog(page, [reducedStockProduct]);

    await checkoutPage.submitButton.click();

    await expect(page).toHaveURL("/checkout");
    await expect(checkoutPage.formError).toHaveText(
      `Only ${reducedStockProduct.stock} items of ${seedCartItem.title} are available. ` +
        "Update the quantity in your cart.",
    );
    await expect(checkoutPage.fullNameInput).toHaveValue(VALID_FULL_NAME);
    await expect(checkoutPage.phoneInput).toHaveValue(VALID_PHONE);
    await expect(checkoutPage.addressInput).toHaveValue(VALID_ADDRESS);
    await expect(checkoutPage.summaryQuantity).toHaveText(`${seedCartItem.quantity} items in cart`);
    await expect(checkoutPage.backToCartLink).toBeVisible();
    await expect(checkoutPage.submitButton).toBeEnabled();
    await expect(checkoutPage.root.getByRole("spinbutton")).toHaveCount(0);

    expect(createOrderRequestCount).toBe(0);
  });

  test("blocks ordering when a product becomes unavailable", async ({ page }) => {
    const seedCartItem = createCartItem(CART_PRODUCT_A);

    await prepareProductCatalog(page, [CART_PRODUCT_A]);
    await prepareCart(page, REGULAR_USER.user.id, [seedCartItem]);

    await checkoutPage.open();
    await expect(checkoutPage.submitButton).toBeEnabled();

    await checkoutPage.fullNameInput.fill(VALID_FULL_NAME);
    await checkoutPage.phoneInput.fill(VALID_PHONE);
    await checkoutPage.addressInput.fill(VALID_ADDRESS);

    // The later empty catalog means the saved product is no longer available.
    await prepareProductCatalog(page, []);

    await checkoutPage.submitButton.click();

    await expect(page).toHaveURL("/checkout");
    await expect(checkoutPage.formError).toHaveText(
      `${seedCartItem.title} is unavailable. Remove it from your cart before checkout.`,
    );
    await expect(checkoutPage.getOrderItem(seedCartItem.title)).toBeVisible();
    await expect(checkoutPage.orderItems).toHaveCount(1);
    await expect(checkoutPage.summaryQuantity).toHaveText("1 item in cart");
    await expect(checkoutPage.fullNameInput).toHaveValue(VALID_FULL_NAME);
    await expect(checkoutPage.phoneInput).toHaveValue(VALID_PHONE);
    await expect(checkoutPage.addressInput).toHaveValue(VALID_ADDRESS);
    await expect(checkoutPage.backToCartLink).toBeVisible();
    await expect(checkoutPage.submitButton).toBeEnabled();

    expect(createOrderRequestCount).toBe(0);
  });

  test("preserves checkout state after a catalog failure and retries on another submission", async ({
    page,
  }) => {
    const seedCartItem = createCartItem(CART_PRODUCT_A, { quantity: 2 });

    await prepareProductCatalog(page, [CART_PRODUCT_A]);
    await prepareCart(page, REGULAR_USER.user.id, [seedCartItem]);

    await checkoutPage.open();
    await expect(checkoutPage.submitButton).toBeEnabled();

    await checkoutPage.fullNameInput.fill(VALID_FULL_NAME);
    await checkoutPage.phoneInput.fill(VALID_PHONE);
    await checkoutPage.addressInput.fill(VALID_ADDRESS);
    await checkoutPage.deliveryMethodSelect.selectOption(DeliveryMethod.Express);
    await checkoutPage.paymentMethodSelect.selectOption(PaymentMethod.Card);

    // The later route makes the first pre-submit catalog check fail.
    await prepareProductCatalogNetworkFailure(page);

    await checkoutPage.submitButton.click();

    await expect(page).toHaveURL("/checkout");
    await expect(checkoutPage.formError).toHaveText("Unable to connect to the server.");
    await expect(checkoutPage.getOrderItem(seedCartItem.title)).toBeVisible();
    await expect(checkoutPage.orderItems).toHaveCount(1);
    await expect(checkoutPage.summaryQuantity).toHaveText(`${seedCartItem.quantity} items in cart`);
    await expect(checkoutPage.fullNameInput).toHaveValue(VALID_FULL_NAME);
    await expect(checkoutPage.phoneInput).toHaveValue(VALID_PHONE);
    await expect(checkoutPage.addressInput).toHaveValue(VALID_ADDRESS);
    await expect(checkoutPage.deliveryMethodSelect).toHaveValue(DeliveryMethod.Express);
    await expect(checkoutPage.paymentMethodSelect).toHaveValue(PaymentMethod.Card);
    await expect(checkoutPage.submitButton).toBeEnabled();

    expect(createOrderRequestCount).toBe(0);

    const heldRetryCatalogRequest = await holdProductCatalogUntilReleased(page, [CART_PRODUCT_A]);

    try {
      await Promise.all([
        checkoutPage.submitButton.click(),
        heldRetryCatalogRequest.requestObserved,
      ]);

      await expect(checkoutPage.submitButton).toBeDisabled();
      await expect(checkoutPage.submitButton).toHaveAttribute("aria-busy", "true");

      // The order request has no mock on purpose: only the fact that the retry
      // reaches the API matters here.
      const createOrderRequestPromise = page.waitForRequest(
        (request) => request.url() === ORDERS_API_URL && request.method() === "POST",
      );

      heldRetryCatalogRequest.release();

      await createOrderRequestPromise;
    } finally {
      await heldRetryCatalogRequest.dispose();
    }
  });

  test("shows an order error without losing the form or cart and clears it on changes", async ({
    page,
  }) => {
    const seedCartItem = createCartItem(CART_PRODUCT_A, { quantity: 2 });

    await prepareProductCatalog(page, [CART_PRODUCT_A]);
    await prepareCart(page, REGULAR_USER.user.id, [seedCartItem]);

    // The only mocked mutation in the suite: a real failure would need a second
    // buyer to exhaust the stock between the pre-submit check and the request.
    await page.route(ORDERS_API_URL, async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();

        return;
      }

      await route.fulfill({
        status: 409,
        json: CREATE_ORDER_ERROR_RESPONSE,
      });
    });

    await checkoutPage.open();
    await expect(checkoutPage.submitButton).toBeEnabled();

    await checkoutPage.fullNameInput.fill(VALID_FULL_NAME);
    await checkoutPage.phoneInput.fill(VALID_PHONE);
    await checkoutPage.addressInput.fill(VALID_ADDRESS);
    await checkoutPage.deliveryMethodSelect.selectOption(DeliveryMethod.Express);
    await checkoutPage.paymentMethodSelect.selectOption(PaymentMethod.Card);

    await checkoutPage.submitButton.click();

    await expect(page).toHaveURL("/checkout");
    await expect(checkoutPage.formError).toHaveText(CREATE_ORDER_ERROR_RESPONSE.error.message);
    await expect(checkoutPage.fullNameInput).toHaveValue(VALID_FULL_NAME);
    await expect(checkoutPage.phoneInput).toHaveValue(VALID_PHONE);
    await expect(checkoutPage.addressInput).toHaveValue(VALID_ADDRESS);
    await expect(checkoutPage.deliveryMethodSelect).toHaveValue(DeliveryMethod.Express);
    await expect(checkoutPage.paymentMethodSelect).toHaveValue(PaymentMethod.Card);
    await expect(checkoutPage.getOrderItem(seedCartItem.title)).toBeVisible();
    await expect(checkoutPage.orderItems).toHaveCount(1);
    await expect(checkoutPage.summaryQuantity).toHaveText(`${seedCartItem.quantity} items in cart`);
    await expect(checkoutPage.summaryTotal).toHaveText(
      `Total: ${formatUsd(CART_PRODUCT_A.price * seedCartItem.quantity)}`,
    );
    await expect(checkoutPage.header.cartLink).toHaveAccessibleName(
      `Cart, ${seedCartItem.quantity} items`,
    );
    await expect(checkoutPage.submitButton).toBeEnabled();

    await checkoutPage.fullNameInput.fill(UPDATED_FULL_NAME);

    await expect(checkoutPage.formError).toBeHidden();

    await checkoutPage.submitButton.click();

    await expect(checkoutPage.formError).toHaveText(CREATE_ORDER_ERROR_RESPONSE.error.message);

    await checkoutPage.deliveryMethodSelect.selectOption(DeliveryMethod.Standard);

    await expect(checkoutPage.formError).toBeHidden();
    await expect(checkoutPage.fullNameInput).toHaveValue(UPDATED_FULL_NAME);
    await expect(checkoutPage.phoneInput).toHaveValue(VALID_PHONE);
    await expect(checkoutPage.addressInput).toHaveValue(VALID_ADDRESS);

    await checkoutPage.submitButton.click();

    await expect(checkoutPage.formError).toHaveText(CREATE_ORDER_ERROR_RESPONSE.error.message);

    await checkoutPage.paymentMethodSelect.selectOption(PaymentMethod.Cash);

    await expect(checkoutPage.formError).toBeHidden();
    await expect(checkoutPage.deliveryMethodSelect).toHaveValue(DeliveryMethod.Standard);
    await expect(checkoutPage.paymentMethodSelect).toHaveValue(PaymentMethod.Cash);
    await expect(checkoutPage.submitButton).toBeEnabled();
  });

  test("does not create an order or return to checkout after the user leaves during cart checking", async ({
    page,
  }) => {
    const seedCartItem = createCartItem(CART_PRODUCT_A);
    const catalogPage = new ProductCatalogPage(page);
    const toast = new ToastComponent(page);

    await prepareProductCatalog(page, [CART_PRODUCT_A]);
    await prepareCart(page, REGULAR_USER.user.id, [seedCartItem]);

    await checkoutPage.open();
    await expect(checkoutPage.submitButton).toBeEnabled();

    await checkoutPage.fullNameInput.fill(VALID_FULL_NAME);
    await checkoutPage.phoneInput.fill(VALID_PHONE);
    await checkoutPage.addressInput.fill(VALID_ADDRESS);

    const heldProductCatalogRequest = await holdProductCatalogUntilReleased(page, [CART_PRODUCT_A]);

    try {
      await Promise.all([
        checkoutPage.submitButton.click(),
        heldProductCatalogRequest.requestObserved,
      ]);

      await expect(checkoutPage.submitButton).toBeDisabled();
      await expect(checkoutPage.submitButton).toHaveAttribute("aria-busy", "true");

      await checkoutPage.header.productsLink.click();

      await expect(page).toHaveURL("/products");

      heldProductCatalogRequest.release();

      await expect(catalogPage.productCards).toHaveCount(1);
      await expect(catalogPage.productTitles).toHaveText([CART_PRODUCT_A.title]);
      await expect(page).toHaveURL("/products");
      await expect(toast.message).toBeEmpty();
      await expect(toast.closeButton).toHaveCount(0);

      expect(createOrderRequestCount).toBe(0);
    } finally {
      await heldProductCatalogRequest.dispose();
    }
  });
});
