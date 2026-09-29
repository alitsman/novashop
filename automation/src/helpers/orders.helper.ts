import type { Page, Route } from "@playwright/test";

import { apiUrl } from "../config/playwright.shared";
import { apiErrorResponseSchema, orderListSchema } from "../schemas";

import type { ApiErrorResponse, Order } from "../types";

const ORDERS_API_URL = new URL("/orders", apiUrl).toString();

const ORDERS_SERVER_FAILURE_RESPONSE = apiErrorResponseSchema.parse({
  error: {
    code: "INTERNAL_SERVER_ERROR",
    message: "Internal server error",
  },
});

type OrdersResponse = {
  status: number;
  json: unknown;
};

async function prepareOrdersResponse(page: Page, response: OrdersResponse): Promise<void> {
  await page.route(ORDERS_API_URL, async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();

      return;
    }

    await route.fulfill({
      status: response.status,
      json: response.json,
    });
  });
}

async function routeCreateOrder(
  page: Page,
  handle: (route: Route) => Promise<void>,
): Promise<void> {
  await page.route(ORDERS_API_URL, async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();

      return;
    }

    await handle(route);
  });
}

export async function prepareOrders(page: Page, orders: Order[]): Promise<void> {
  const validatedOrders = orderListSchema.parse(orders);

  await prepareOrdersResponse(page, {
    status: 200,
    json: validatedOrders,
  });
}

export async function prepareOrdersServerFailure(page: Page): Promise<void> {
  await prepareOrdersResponse(page, {
    status: 500,
    json: ORDERS_SERVER_FAILURE_RESPONSE,
  });
}

export async function prepareCreateOrderNetworkFailure(page: Page): Promise<void> {
  await routeCreateOrder(page, (route) => route.abort("connectionfailed"));
}

export async function prepareCreateOrderError(
  page: Page,
  status: number,
  response: ApiErrorResponse,
): Promise<void> {
  const validatedResponse = apiErrorResponseSchema.parse(response);

  await routeCreateOrder(page, (route) =>
    route.fulfill({
      status,
      json: validatedResponse,
    }),
  );
}
