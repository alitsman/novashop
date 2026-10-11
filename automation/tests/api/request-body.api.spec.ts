import { expect, test, type APIRequestContext } from "@playwright/test";

import { FeatureTag } from "../../src/config/test-tags";
import type { ApiErrorResponse } from "../../src/types";

// express.json() accepts up to 100 KB by default.
const OVERSIZED_BODY = JSON.stringify({ padding: "a".repeat(101 * 1024) });

// String data is sent as-is, so the request can contain invalid JSON.
const postRawJson = (request: APIRequestContext, body: string) => {
  return request.post("/auth/login", {
    headers: { "Content-Type": "application/json" },
    data: body,
  });
};

// One test for each error type handled by jsonBodyErrorHandler.
test.describe("API request body", { tag: FeatureTag.Platform }, () => {
  test("malformed JSON: returns INVALID_JSON", async ({ request }) => {
    const response = await postRawJson(request, '{"email":');

    expect(response.status()).toBe(400);

    const responseBody = (await response.json()) as ApiErrorResponse;

    expect(responseBody).toEqual({
      error: {
        code: "INVALID_JSON",
        message: "Request body must be valid JSON",
      },
    });
  });

  test("body larger than 100 KB: returns PAYLOAD_TOO_LARGE", async ({ request }) => {
    const response = await postRawJson(request, OVERSIZED_BODY);

    expect(response.status()).toBe(413);

    const responseBody = (await response.json()) as ApiErrorResponse;

    expect(responseBody).toEqual({
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Request body is too large",
      },
    });
  });
});
