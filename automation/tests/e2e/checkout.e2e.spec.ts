import { randomUUID } from "node:crypto";

import { ToastComponent } from "../../src/components";
import { apiUrl } from "../../src/config/playwright.shared";
import { expect, test } from "../../src/fixtures";
import {
  createProductViaApi,
  holdRequestUntilReleased,
  loginViaApi,
  prepareCart,
  registerUserViaApi,
  seedAuthTokenForEachPageLoad,
} from "../../src/helpers";
import { CheckoutPage, OrdersPage, ProductCatalogPage } from "../../src/pages";
import { orderSchema } from "../../src/schemas";
import { ADMIN_USER, createCartItem } from "../../src/test-data";
import { DeliveryMethod, PaymentMethod } from "../../src/types";
import { formatUsd } from "../../src/utils";

const ORDERS_API_URL = new URL("/orders", apiUrl).toString();

const ORDER_FULL_NAME = "Ivan Ivanov";
const ORDER_PHONE = "+995 555 123 456";
const ORDER_ADDRESS = "123 E2E Test Street";

const PRODUCT_PRICE = 47.5;
const PRODUCT_STOCK = 5;
const ORDER_QUANTITY = 2;

test.describe("checkout", () => {
  test("creates one order, blocks duplicate submission, and refreshes cart and stock", async ({
    page,
    backendRequest,
  }) => {
    const customerAuth = await registerUserViaApi(backendRequest);
    const adminToken = await loginViaApi(backendRequest, ADMIN_USER);

    const product = await createProductViaApi(backendRequest, adminToken, {
      title: `E2E Checkout Product ${randomUUID()}`,
      price: PRODUCT_PRICE,
      stock: PRODUCT_STOCK,
    });

    await seedAuthTokenForEachPageLoad(page, customerAuth.token);
    await prepareCart(page, customerAuth.user.id, [
      createCartItem(product, {
        quantity: ORDER_QUANTITY,
      }),
    ]);

    const checkoutPage = new CheckoutPage(page);
    const ordersPage = new OrdersPage(page);
    const catalogPage = new ProductCatalogPage(page);
    const toast = new ToastComponent(page);

    let createOrderRequestCount = 0;

    page.on("request", (request) => {
      if (request.url() === ORDERS_API_URL && request.method() === "POST") {
        createOrderRequestCount += 1;
      }
    });

    await checkoutPage.open();

    await expect(page).toHaveURL("/checkout");
    await expect(checkoutPage.heading).toBeVisible();
    await expect(checkoutPage.submitButton).toBeEnabled();

    const checkoutItem = checkoutPage.getOrderItem(product.title);
    const expectedOrderTotal = product.price * ORDER_QUANTITY;

    await expect(checkoutItem).toBeVisible();
    await expect(checkoutPage.summaryQuantity).toHaveText(`${ORDER_QUANTITY} items in cart`);
    await expect(checkoutPage.getOrderItemTotal(product.title)).toHaveText(
      formatUsd(expectedOrderTotal),
    );
    await expect(checkoutPage.summaryTotal).toHaveText(`Total: ${formatUsd(expectedOrderTotal)}`);

    await checkoutPage.fullNameInput.fill(ORDER_FULL_NAME);
    await checkoutPage.phoneInput.fill(ORDER_PHONE);
    await checkoutPage.addressInput.fill(ORDER_ADDRESS);
    await checkoutPage.deliveryMethodSelect.selectOption(DeliveryMethod.Express);
    await checkoutPage.paymentMethodSelect.selectOption(PaymentMethod.Card);

    const heldOrderRequest = await holdRequestUntilReleased(page, {
      url: ORDERS_API_URL,
      method: "POST",
    });

    // Start observing the request and response before submitting so Playwright
    // cannot miss either event when the held request is released.
    const createOrderRequestPromise = page.waitForRequest(
      (request) => request.url() === ORDERS_API_URL && request.method() === "POST",
    );
    const createOrderResponsePromise = page.waitForResponse(
      (response) => response.url() === ORDERS_API_URL && response.request().method() === "POST",
    );

    let createOrderResponseBody: unknown;

    try {
      await Promise.all([checkoutPage.submitButton.click(), heldOrderRequest.requestObserved]);

      const createOrderRequest = await createOrderRequestPromise;

      // Checkout sends only the fields it owns. The server derives userId, title, and price,
      // so verify the exact payload at the real frontend-backend boundary.
      expect(createOrderRequest.postDataJSON()).toEqual({
        items: [
          {
            productId: product.id,
            quantity: ORDER_QUANTITY,
          },
        ],
        fullName: ORDER_FULL_NAME,
        phone: ORDER_PHONE,
        address: ORDER_ADDRESS,
        deliveryMethod: DeliveryMethod.Express,
        paymentMethod: PaymentMethod.Card,
      });

      await expect(checkoutPage.submitButton).toBeDisabled();
      await expect(checkoutPage.submitButton).toHaveAttribute("aria-busy", "true");
      await expect(checkoutPage.submitButton).toHaveText("Placing order...");

      // Pressing Enter repeats the user's submit action while the first order
      // is pending. A second POST would create another order and reduce stock again.
      await checkoutPage.phoneInput.press("Enter");

      heldOrderRequest.release();

      const createOrderResponse = await createOrderResponsePromise;

      expect(createOrderResponse.status()).toBe(201);

      createOrderResponseBody = await createOrderResponse.json();
    } finally {
      await heldOrderRequest.dispose();
    }

    // Validate the real response before using orderNumber.
    // Detailed response assertions belong to the Orders API suite.
    const createdOrderNumber = orderSchema.parse(createOrderResponseBody).orderNumber;

    await expect(page).toHaveURL("/orders");
    await expect(ordersPage.heading).toBeVisible();
    await expect(toast.message).toHaveText("Order created successfully.");
    await expect(ordersPage.header.cartLink).toHaveAccessibleName("Cart, 0 items");

    const createdOrderCard = ordersPage.getOrder(createdOrderNumber);
    const createdOrderProduct = ordersPage.getOrderProduct(createdOrderNumber, product.title);

    await expect(createdOrderCard).toBeVisible();
    await expect(createdOrderCard.getByText(ORDER_FULL_NAME, { exact: true })).toBeVisible();
    await expect(createdOrderCard.getByText(ORDER_ADDRESS, { exact: true })).toBeVisible();
    await expect(createdOrderCard.getByText("Express delivery", { exact: true })).toBeVisible();
    await expect(createdOrderCard.getByText("Card", { exact: true })).toBeVisible();
    await expect(ordersPage.getOrderTotal(createdOrderNumber)).toHaveText(
      formatUsd(expectedOrderTotal),
    );
    await expect(createdOrderProduct).toBeVisible();

    await ordersPage.header.productsLink.click();

    await expect(page).toHaveURL("/products");
    await expect(catalogPage.heading).toBeVisible();

    const catalogProduct = catalogPage.getProductCard(product.title);

    await expect(catalogProduct.addToCart.available).toHaveText(
      `Available: ${PRODUCT_STOCK - ORDER_QUANTITY}`,
    );
    await expect(catalogPage.header.cartLink).toHaveAccessibleName("Cart, 0 items");

    expect(createOrderRequestCount).toBe(1);
  });

  test("preserves newer cart changes when order success arrives after leaving checkout", async ({
    page,
    backendRequest,
  }) => {
    const customerAuth = await registerUserViaApi(backendRequest);
    const adminToken = await loginViaApi(backendRequest, ADMIN_USER);

    const orderedProduct = await createProductViaApi(backendRequest, adminToken, {
      title: `E2E Checkout Ordered Product ${randomUUID()}`,
      price: PRODUCT_PRICE,
      stock: PRODUCT_STOCK,
    });

    const newerCartProduct = await createProductViaApi(backendRequest, adminToken, {
      title: `E2E Checkout New Cart Product ${randomUUID()}`,
      price: PRODUCT_PRICE,
      stock: PRODUCT_STOCK,
    });

    await seedAuthTokenForEachPageLoad(page, customerAuth.token);
    await prepareCart(page, customerAuth.user.id, [
      createCartItem(orderedProduct, {
        quantity: ORDER_QUANTITY,
      }),
    ]);

    const checkoutPage = new CheckoutPage(page);
    const ordersPage = new OrdersPage(page);
    const catalogPage = new ProductCatalogPage(page);
    const toast = new ToastComponent(page);

    await checkoutPage.open();

    await expect(page).toHaveURL("/checkout");
    await expect(checkoutPage.submitButton).toBeEnabled();

    await checkoutPage.fullNameInput.fill(ORDER_FULL_NAME);
    await checkoutPage.phoneInput.fill(ORDER_PHONE);
    await checkoutPage.addressInput.fill(ORDER_ADDRESS);

    const heldOrderRequest = await holdRequestUntilReleased(page, {
      url: ORDERS_API_URL,
      method: "POST",
    });

    const createOrderResponsePromise = page.waitForResponse(
      (response) => response.url() === ORDERS_API_URL && response.request().method() === "POST",
    );

    let createOrderResponseBody: unknown;

    try {
      // Keep Checkout waiting while the user leaves the page and changes the cart.
      await Promise.all([checkoutPage.submitButton.click(), heldOrderRequest.requestObserved]);

      await checkoutPage.header.productsLink.click();

      await expect(page).toHaveURL("/products");
      await expect(catalogPage.heading).toBeVisible();

      const orderedProductCard = catalogPage.getProductCard(orderedProduct.title);
      const newerCartProductCard = catalogPage.getProductCard(newerCartProduct.title);

      await newerCartProductCard.addToCart.submit();

      await expect(newerCartProductCard.addToCart.inCart).toHaveText("In cart: 1");
      await expect(catalogPage.header.cartLink).toHaveAccessibleName(
        `Cart, ${ORDER_QUANTITY + 1} items`,
      );

      await expect(toast.message).toHaveText(`${newerCartProduct.title} added to cart.`);

      // Clear the Add to cart notification so any late Checkout success toast is unambiguous.
      await toast.close();
      await expect(toast.closeButton).toHaveCount(0);

      heldOrderRequest.release();

      const createOrderResponse = await createOrderResponsePromise;

      expect(createOrderResponse.status()).toBe(201);

      createOrderResponseBody = await createOrderResponse.json();

      await expect(catalogPage.header.cartLink).toHaveAccessibleName("Cart, 1 item");
      await expect(orderedProductCard.addToCart.inCart).toHaveCount(0);
      await expect(newerCartProductCard.addToCart.inCart).toHaveText("In cart: 1");

      // The cart update proves the late success has been applied,
      // so the page must still be the one the user moved to.
      await expect(page).toHaveURL("/products");
      await expect(toast.message).toBeEmpty();
      await expect(toast.closeButton).toHaveCount(0);
    } finally {
      await heldOrderRequest.dispose();
    }

    // Validate the real response before using orderNumber.
    // Detailed response assertions belong to the Orders API suite.
    const createdOrderNumber = orderSchema.parse(createOrderResponseBody).orderNumber;

    await catalogPage.header.myOrdersLink.click();

    await expect(page).toHaveURL("/orders");
    await expect(ordersPage.heading).toBeVisible();

    const createdOrderCard = ordersPage.getOrder(createdOrderNumber);
    const orderedProductInOrder = ordersPage.getOrderProduct(
      createdOrderNumber,
      orderedProduct.title,
    );

    await expect(createdOrderCard).toBeVisible();
    await expect(orderedProductInOrder).toBeVisible();
  });
});
