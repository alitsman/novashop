import { expect, test } from "@playwright/test";

import { createTestAuthToken, loginViaApi } from "../../src/helpers";
import { ADMIN_USER, REGULAR_USER } from "../../src/test-data";
import type { ApiErrorResponse, AuthUser } from "../../src/types";

// This is a valid UUID that does not match any seeded user.
const NON_EXISTENT_USER_ID = "00000000-0000-4000-8000-000000000000";

// These tokens fail at different validation steps but must return the same public error.
// Each case protects a separate check; the HS512 case specifically protects algorithm pinning.
const invalidTokenCases = [
  {
    name: "malformed token",
    createToken: () => "not-a-jwt",
  },
  {
    name: "token signed with a different secret",
    createToken: () =>
      createTestAuthToken({
        sub: REGULAR_USER.user.id,
        role: REGULAR_USER.user.role,
        secret: "different-test-secret",
      }),
  },
  {
    name: "token signed with a disallowed algorithm",
    createToken: () =>
      createTestAuthToken({
        sub: REGULAR_USER.user.id,
        role: REGULAR_USER.user.role,
        algorithm: "HS512",
      }),
  },
  {
    name: "token without role",
    createToken: () =>
      createTestAuthToken({
        sub: REGULAR_USER.user.id,
      }),
  },
];

test.describe("GET /me", () => {
  test("regular user login token: returns the regular user", async ({ request }) => {
    const token = await loginViaApi(request, REGULAR_USER);

    const meResponse = await request.get("/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(meResponse.status()).toBe(200);

    const responseBody = (await meResponse.json()) as AuthUser;
    expect(responseBody).toEqual(REGULAR_USER.user);
  });

  test("admin login token: returns the admin user", async ({ request }) => {
    const token = await loginViaApi(request, ADMIN_USER);

    const meResponse = await request.get("/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(meResponse.status()).toBe(200);

    const responseBody = (await meResponse.json()) as AuthUser;

    expect(responseBody).toEqual(ADMIN_USER.user);
  });

  test("missing authorization header: returns AUTHENTICATION_REQUIRED", async ({ request }) => {
    const meResponse = await request.get("/me");

    expect(meResponse.status()).toBe(401);

    const responseBody = (await meResponse.json()) as ApiErrorResponse;

    expect(responseBody).toEqual({
      error: {
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication is required",
      },
    });
  });

  test("non-Bearer authorization scheme: returns AUTHENTICATION_REQUIRED", async ({ request }) => {
    const meResponse = await request.get("/me", {
      headers: {
        Authorization: "Basic credentials",
      },
    });

    expect(meResponse.status()).toBe(401);

    const responseBody = (await meResponse.json()) as ApiErrorResponse;

    expect(responseBody).toEqual({
      error: {
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication is required",
      },
    });
  });

  for (const invalidTokenCase of invalidTokenCases) {
    test(`${invalidTokenCase.name}: returns INVALID_TOKEN`, async ({ request }) => {
      const token = invalidTokenCase.createToken();

      const meResponse = await request.get("/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(meResponse.status()).toBe(401);

      const responseBody = (await meResponse.json()) as ApiErrorResponse;

      expect(responseBody).toEqual({
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid authentication token",
        },
      });
    });
  }

  test("expired token: returns TOKEN_EXPIRED", async ({ request }) => {
    const token = createTestAuthToken({
      sub: REGULAR_USER.user.id,
      role: REGULAR_USER.user.role,
      expiresInSeconds: -60,
    });

    const meResponse = await request.get("/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(meResponse.status()).toBe(401);

    const responseBody = (await meResponse.json()) as ApiErrorResponse;

    expect(responseBody).toEqual({
      error: {
        code: "TOKEN_EXPIRED",
        message: "Your session has expired",
      },
    });
  });

  // This token passes JWT verification.
  // The request fails later because the user does not exist in the database.
  test("valid token for a non-existent user: returns INVALID_TOKEN", async ({ request }) => {
    const token = createTestAuthToken({
      sub: NON_EXISTENT_USER_ID,
      role: REGULAR_USER.user.role,
    });

    const meResponse = await request.get("/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(meResponse.status()).toBe(401);

    const responseBody = (await meResponse.json()) as ApiErrorResponse;

    expect(responseBody).toEqual({
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid authentication token",
      },
    });
  });
});
