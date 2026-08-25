import assert from "node:assert/strict";

import { expect } from "@playwright/test";
import type { APIResponse } from "@playwright/test";

import type { ApiErrorResponse } from "../types";

// Use this helper only when a test expects exactly one validation issue.
// The path can point to a field such as ["price"] or to the whole request
// object with an empty array.
export async function expectSingleValidationError(
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
