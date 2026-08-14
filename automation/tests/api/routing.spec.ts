import { expect, test } from "@playwright/test";

import type { ApiErrorResponse } from "../../src/types";

test.describe("API routing", () => {
  test("unknown route: returns ROUTE_NOT_FOUND", async ({ request }) => {
    const response = await request.get("/does-not-exist");

    expect(response.status()).toBe(404);

    const responseBody = (await response.json()) as ApiErrorResponse;

    expect(responseBody).toEqual({
      error: {
        code: "ROUTE_NOT_FOUND",
        message: "Route not found: /does-not-exist",
      },
    });
  });
});
