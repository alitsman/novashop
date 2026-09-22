import type { Page } from "@playwright/test";

import { apiUrl } from "../config/playwright.shared";
import { apiErrorResponseSchema, orderListSchema } from "../schemas";

import type { Order } from "../types";

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
      await route.abort();

      return;
    }

    await route.fulfill({
      status: response.status,
      json: response.json,
    });
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
