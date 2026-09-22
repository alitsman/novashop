import { apiUrl } from "../../src/config/playwright.shared";
import { expect, test } from "../../src/fixtures";
import {
  holdRequestUntilReleased,
  prepareMockedAuthenticatedSession,
  prepareOrders,
  prepareOrdersServerFailure,
} from "../../src/helpers";
import { OrdersPage } from "../../src/pages";
import { orderListSchema } from "../../src/schemas";
import { ORDERS_OLDER_ORDER, ORDERS_REFERENCE_ORDER, REGULAR_USER } from "../../src/test-data";

const ORDERS_API_URL = new URL("/orders", apiUrl).toString();

// Fix the browser timezone so the exact order date is deterministic locally and in CI.
test.use({ timezoneId: "UTC" });

test.describe("my orders", () => {
  test("shows loading state until orders are loaded", async ({ page }) => {
    await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);

    const orders = orderListSchema.parse([ORDERS_REFERENCE_ORDER]);

    const heldOrdersRequest = await holdRequestUntilReleased(page, {
      url: ORDERS_API_URL,
      method: "GET",
      fulfillWith: {
        status: 200,
        json: orders,
      },
    });

    const ordersPage = new OrdersPage(page);

    try {
      await Promise.all([ordersPage.open(), heldOrdersRequest.requestObserved]);

      await expect(ordersPage.heading).toBeVisible();
      await expect(ordersPage.loadingStatus).toBeVisible();
      await expect(ordersPage.emptyStateTitle).toHaveCount(0);
      await expect(ordersPage.errorAlert).toHaveCount(0);
      await expect(ordersPage.ordersList).toHaveCount(0);

      heldOrdersRequest.release();

      await expect(ordersPage.ordersList).toBeVisible();
      await expect(ordersPage.loadingStatus).toHaveCount(0);
    } finally {
      await heldOrdersRequest.dispose();
    }
  });

  test("shows complete order details", async ({ page }) => {
    await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);
    await prepareOrders(page, [ORDERS_REFERENCE_ORDER]);

    const ordersPage = new OrdersPage(page);

    await ordersPage.open();

    const orderCard = ordersPage.getOrder(ORDERS_REFERENCE_ORDER.orderNumber);
    const firstProduct = ordersPage.getOrderProduct(
      ORDERS_REFERENCE_ORDER.orderNumber,
      ORDERS_REFERENCE_ORDER.items[0].title,
    );
    const secondProduct = ordersPage.getOrderProduct(
      ORDERS_REFERENCE_ORDER.orderNumber,
      ORDERS_REFERENCE_ORDER.items[1].title,
    );

    await expect(orderCard).toBeVisible();

    await expect(
      orderCard.getByText("Placed on Sep 20, 2026, 10:15 AM", {
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      orderCard.getByText(ORDERS_REFERENCE_ORDER.fullName, {
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      orderCard.getByText(ORDERS_REFERENCE_ORDER.address, {
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      orderCard.getByText("Standard delivery", {
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      orderCard.getByText("Cash", {
        exact: true,
      }),
    ).toBeVisible();

    await expect(ordersPage.getOrderTotal(ORDERS_REFERENCE_ORDER.orderNumber)).toHaveText("$44.99");

    await expect(
      orderCard.getByText("3 items", {
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      orderCard.getByRole("heading", {
        name: "Ordered products",
        level: 3,
        exact: true,
      }),
    ).toBeVisible();

    await expect(firstProduct).toBeVisible();
    await expect(
      firstProduct.getByText("1 item × $19.99", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(firstProduct.getByTestId("item-total")).toHaveText("$19.99");

    await expect(secondProduct).toBeVisible();
    await expect(
      secondProduct.getByText("2 items × $12.50", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(secondProduct.getByTestId("item-total")).toHaveText("$25.00");
  });

  test("shows empty state for successful empty history", async ({ page }) => {
    await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);
    await prepareOrders(page, []);

    const ordersPage = new OrdersPage(page);

    // Wait for the read to finish so the initial empty render is not mistaken for the final state.
    const ordersResponsePromise = page.waitForResponse(
      (response) => response.url() === ORDERS_API_URL && response.request().method() === "GET",
    );

    await Promise.all([ordersPage.open(), ordersResponsePromise]);

    await expect(ordersPage.loadingStatus).toHaveCount(0);
    await expect(ordersPage.emptyStateTitle).toBeVisible();
    await expect(
      ordersPage.root.getByText("Complete your first checkout to see your order history here.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(ordersPage.errorAlert).toHaveCount(0);
    await expect(ordersPage.ordersList).toHaveCount(0);
    await expect(ordersPage.goToProductsLink).toBeVisible();

    await ordersPage.goToProductsLink.click();

    await expect(page).toHaveURL("/products");
  });

  test("shows error state when orders loading fails", async ({ page }) => {
    await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);
    await prepareOrdersServerFailure(page);

    const ordersPage = new OrdersPage(page);

    await ordersPage.open();

    await expect(ordersPage.errorAlert).toBeVisible();
    await expect(ordersPage.errorAlert).toContainText("Internal server error");
    await expect(ordersPage.loadingStatus).toHaveCount(0);
    await expect(ordersPage.emptyStateTitle).toHaveCount(0);
    await expect(ordersPage.ordersList).toHaveCount(0);
  });

  test("shows multiple orders newest first with delivery and payment mappings", async ({
    page,
  }) => {
    await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);
    await prepareOrders(page, [ORDERS_REFERENCE_ORDER, ORDERS_OLDER_ORDER]);

    const ordersPage = new OrdersPage(page);

    await ordersPage.open();

    const orderCards = ordersPage.ordersList.getByRole("article");

    await expect(orderCards).toHaveCount(2);

    // Order position is part of this test: newer orders must appear before older ones.
    await expect(orderCards.nth(0)).toHaveAccessibleName(
      `Order #${ORDERS_REFERENCE_ORDER.orderNumber}`,
    );
    await expect(orderCards.nth(1)).toHaveAccessibleName(
      `Order #${ORDERS_OLDER_ORDER.orderNumber}`,
    );

    const newestOrder = ordersPage.getOrder(ORDERS_REFERENCE_ORDER.orderNumber);
    const olderOrder = ordersPage.getOrder(ORDERS_OLDER_ORDER.orderNumber);

    await expect(
      newestOrder.getByText("Standard delivery", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      newestOrder.getByText("Cash", {
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      olderOrder.getByText("Express delivery", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      olderOrder.getByText("Card", {
        exact: true,
      }),
    ).toBeVisible();

    await expect(ordersPage.continueShoppingLink).toBeVisible();

    await ordersPage.continueShoppingLink.click();

    await expect(page).toHaveURL("/products");
  });

  test("clears previous error after reopening orders successfully", async ({ page }) => {
    await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);
    await prepareOrdersServerFailure(page);

    const ordersPage = new OrdersPage(page);

    await ordersPage.open();

    await expect(ordersPage.errorAlert).toBeVisible();
    await expect(ordersPage.errorAlert).toContainText("Internal server error");

    await ordersPage.header.cartLink.click();

    await expect(page).toHaveURL("/cart");

    // Replace the failed response so reopening My Orders gets a successful read.
    await page.unroute(ORDERS_API_URL);
    await prepareOrders(page, [ORDERS_REFERENCE_ORDER]);

    await ordersPage.header.myOrdersLink.click();

    const orderCard = ordersPage.getOrder(ORDERS_REFERENCE_ORDER.orderNumber);

    await expect(orderCard).toBeVisible();
    await expect(ordersPage.errorAlert).toHaveCount(0);
    await expect(ordersPage.emptyStateTitle).toHaveCount(0);
  });
});
