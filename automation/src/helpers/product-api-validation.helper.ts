import assert from "node:assert/strict";

import { expect } from "@playwright/test";
import type { APIResponse } from "@playwright/test";

import type { ApiErrorResponse } from "../types";

// Use this shared helper only for Product API cases intentionally designed to
// return exactly one validation issue. The expected path can identify either a
// field such as ["price"] or the request object itself with an empty path.
export async function expectSingleProductValidationError(
  response: APIResponse,
  expectedPath: (string | number)[],
): Promise<void> {
  expect(response.status()).toBe(400);

  const responseBody = (await response.json()) as ApiErrorResponse;

  expect(responseBody.error.code).toBe("VALIDATION_ERROR");
  expect(responseBody.error.message).toBe("Request validation failed");

  const { details } = responseBody.error;

  assert(
    Array.isArray(details),
    "Expected validation error details to be an array",
  );

  const validationIssues: unknown[] = details;

  expect(validationIssues).toHaveLength(1);

  const [validationIssue] = validationIssues;

  expect(validationIssue).toMatchObject({
    path: expectedPath,
  });
}
