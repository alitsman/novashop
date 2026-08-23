import assert from "node:assert/strict";

import { expect, test } from "@playwright/test";
import jsonwebtoken from "jsonwebtoken";

import { REGULAR_USER } from "../../src/test-data";
import type { ApiErrorResponse, AuthResponse } from "../../src/types";

const JWT_WITH_THREE_NON_EMPTY_BASE64URL_PARTS_SEPARATED_BY_DOTS =
  /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

const EXPECTED_TOKEN_LIFETIME_SECONDS = 7 * 24 * 60 * 60;

const WRONG_PASSWORD = "wrongPassword";
const MISSING_EMAIL = "missing@email.novashop";

test.describe("POST /auth/login", () => {
  test("valid credentials: returns a token and the safe user", async ({
    request,
  }) => {
    const response = await request.post("/auth/login", {
      data: {
        email: REGULAR_USER.user.email,
        password: REGULAR_USER.password,
      },
    });

    expect(response.status()).toBe(200);

    const responseBody = (await response.json()) as AuthResponse;
    const { token, ...responseWithoutToken } = responseBody;

    expect(responseWithoutToken).toEqual({
      user: REGULAR_USER.user,
    });

    expect(token).toMatch(
      JWT_WITH_THREE_NON_EMPTY_BASE64URL_PARTS_SEPARATED_BY_DOTS,
    );
  });

  test("valid credentials: issues a JWT with the expected claims", async ({
    request,
  }) => {
    const response = await request.post("/auth/login", {
      data: {
        email: REGULAR_USER.user.email,
        password: REGULAR_USER.password,
      },
    });

    expect(response.status()).toBe(200);

    const responseBody = (await response.json()) as AuthResponse;
    const decodedToken = jsonwebtoken.decode(responseBody.token, {
      complete: true,
    });

    // Unlike Playwright expect, Node assert also narrows the decoded JWT type for TypeScript.
    assert(
      decodedToken !== null && typeof decodedToken.payload !== "string",
      "Expected the login endpoint to return a JWT with an object payload",
    );

    const { header, payload } = decodedToken;

    expect(header.alg).toBe("HS256");
    expect(payload.sub).toBe(REGULAR_USER.user.id);
    expect(payload.role).toBe(REGULAR_USER.user.role);

    assert(
      typeof payload.iat === "number" && typeof payload.exp === "number",
      "Expected the login JWT to contain numeric iat and exp claims",
    );

    expect(payload.exp - payload.iat).toBe(EXPECTED_TOKEN_LIFETIME_SECONDS);
  });

  test("email with surrounding spaces and different casing: logs in successfully", async ({
    request,
  }) => {
    const emailWithMixedCase = Array.from(
      REGULAR_USER.user.email,
      (character, index) =>
        index % 2 === 0 ? character.toUpperCase() : character.toLowerCase(),
    ).join("");

    const response = await request.post("/auth/login", {
      data: {
        email: `  ${emailWithMixedCase}  `,
        password: REGULAR_USER.password,
      },
    });

    expect(response.status()).toBe(200);

    const responseBody = (await response.json()) as AuthResponse;
    const { token, ...responseWithoutToken } = responseBody;

    expect(responseWithoutToken).toEqual({
      user: REGULAR_USER.user,
    });

    expect(token).toMatch(
      JWT_WITH_THREE_NON_EMPTY_BASE64URL_PARTS_SEPARATED_BY_DOTS,
    );
  });

  test("invalid password: returns INVALID_CREDENTIALS", async ({ request }) => {
    const response = await request.post("/auth/login", {
      data: {
        email: REGULAR_USER.user.email,
        password: WRONG_PASSWORD,
      },
    });

    expect(response.status()).toBe(401);

    const responseBody = (await response.json()) as ApiErrorResponse;

    expect(responseBody.error.code).toBe("INVALID_CREDENTIALS");
    expect(responseBody.error.message).toBe("Invalid email or password");
  });

  test("unknown email: returns INVALID_CREDENTIALS", async ({ request }) => {
    const response = await request.post("/auth/login", {
      data: {
        email: MISSING_EMAIL,
        password: WRONG_PASSWORD,
      },
    });

    expect(response.status()).toBe(401);

    const responseBody = (await response.json()) as ApiErrorResponse;

    expect(responseBody.error.code).toBe("INVALID_CREDENTIALS");
    expect(responseBody.error.message).toBe("Invalid email or password");
  });

  test("missing password: returns VALIDATION_ERROR with details", async ({
    request,
  }) => {
    const response = await request.post("/auth/login", {
      data: {
        email: REGULAR_USER.user.email,
      },
    });

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
      path: ["password"],
    });
  });
});
