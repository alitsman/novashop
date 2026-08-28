import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

import type { ApiErrorResponse, AuthUser, AuthResponse, NewAccount } from "../../src/types";

const JWT_WITH_THREE_NON_EMPTY_BASE64URL_PARTS_SEPARATED_BY_DOTS =
  /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_PASSWORD = "NewUser123!";

const weakPasswordCases = [
  {
    name: "fewer than 8 characters",
    password: "Ab1!xyz",
  },
  {
    name: "without an uppercase letter",
    password: "newuser123!",
  },
  {
    name: "without a number",
    password: "NewUserPass!",
  },
  {
    name: "without a special character",
    password: "NewUser123",
  },
];

function buildNewAccount(name: string): NewAccount {
  return {
    user: {
      name,
      email: `user-${randomUUID()}@test.com`,
    },
    password: VALID_PASSWORD,
  };
}

test.describe("POST /auth/register", () => {
  test.describe("successful registration", () => {
    test("valid data: creates a regular user and returns an auth response", async ({ request }) => {
      const newAccount = buildNewAccount("New Registered User");

      const response = await request.post("/auth/register", {
        data: {
          name: newAccount.user.name,
          email: newAccount.user.email,
          password: newAccount.password,
        },
      });

      expect(response.status()).toBe(201);

      const responseBody = (await response.json()) as AuthResponse;
      const { id, ...userWithoutId } = responseBody.user;

      // The database generates the id, so we check its format.
      expect(id).toMatch(UUID_PATTERN);

      // Role is asserted as a literal: public registration always creates a
      // regular user, and the request never sends a role.
      // Exact equality also checks that password data is not returned.
      expect(userWithoutId).toEqual({
        name: newAccount.user.name,
        email: newAccount.user.email,
        role: "user",
      });

      expect(responseBody.token).toMatch(
        JWT_WITH_THREE_NON_EMPTY_BASE64URL_PARTS_SEPARATED_BY_DOTS,
      );
    });

    test("name and email with spaces and uppercase email: returns normalized user data", async ({
      request,
    }) => {
      const newAccount = buildNewAccount("Normalized User");

      const response = await request.post("/auth/register", {
        data: {
          name: `  ${newAccount.user.name}  `,
          email: `  ${newAccount.user.email.toUpperCase()}  `,
          password: newAccount.password,
        },
      });

      expect(response.status()).toBe(201);

      const responseBody = (await response.json()) as AuthResponse;

      expect(responseBody.user.name).toBe(newAccount.user.name);
      expect(responseBody.user.email).toBe(newAccount.user.email);
    });
  });

  test.describe("privilege escalation", () => {
    test("admin role in request: creates a regular user", async ({ request }) => {
      const newAccount = buildNewAccount("Role Injection User");

      const response = await request.post("/auth/register", {
        data: {
          name: newAccount.user.name,
          email: newAccount.user.email,
          password: newAccount.password,
          role: "admin",
        },
      });

      expect(response.status()).toBe(201);

      const responseBody = (await response.json()) as AuthResponse;

      expect(responseBody.user).toEqual({
        id: expect.stringMatching(UUID_PATTERN),
        name: newAccount.user.name,
        email: newAccount.user.email,
        role: "user",
      });

      const adminRouteResponse = await request.post("/products", {
        headers: {
          Authorization: `Bearer ${responseBody.token}`,
        },
        data: {},
      });

      expect(adminRouteResponse.status()).toBe(403);

      const adminRouteResponseBody = (await adminRouteResponse.json()) as ApiErrorResponse;

      expect(adminRouteResponseBody).toEqual({
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        },
      });
    });
  });

  test.describe("created account authentication", () => {
    test("registered credentials: can log in as the created user", async ({ request }) => {
      const newAccount = buildNewAccount("Login After Registration User");

      const registerResponse = await request.post("/auth/register", {
        data: {
          name: newAccount.user.name,
          email: newAccount.user.email,
          password: newAccount.password,
        },
      });

      expect(registerResponse.status()).toBe(201);

      const registerResponseBody = (await registerResponse.json()) as AuthResponse;

      // Registration can return 201 even if the password was saved incorrectly.
      // A successful login proves that the saved password can be verified.
      const loginResponse = await request.post("/auth/login", {
        data: {
          email: newAccount.user.email,
          password: newAccount.password,
        },
      });

      expect(loginResponse.status()).toBe(200);

      const loginResponseBody = (await loginResponse.json()) as AuthResponse;

      expect(loginResponseBody.user).toEqual(registerResponseBody.user);
    });

    test("registration token: authenticates the created user", async ({ request }) => {
      const newAccount = buildNewAccount("Registration Token User");

      const registerResponse = await request.post("/auth/register", {
        data: {
          name: newAccount.user.name,
          email: newAccount.user.email,
          password: newAccount.password,
        },
      });

      expect(registerResponse.status()).toBe(201);

      const registerResponseBody = (await registerResponse.json()) as AuthResponse;

      // JWT format alone does not prove that the backend accepts the token.
      const meResponse = await request.get("/me", {
        headers: {
          Authorization: `Bearer ${registerResponseBody.token}`,
        },
      });

      expect(meResponse.status()).toBe(200);

      const meResponseBody = (await meResponse.json()) as AuthUser;

      expect(meResponseBody).toEqual(registerResponseBody.user);
    });
  });

  test.describe("duplicate email", () => {
    test("same email: returns EMAIL_ALREADY_EXISTS", async ({ request }) => {
      const newAccount = buildNewAccount("Duplicate Email User");

      const firstResponse = await request.post("/auth/register", {
        data: {
          name: newAccount.user.name,
          email: newAccount.user.email,
          password: newAccount.password,
        },
      });

      expect(firstResponse.status()).toBe(201);

      const duplicateResponse = await request.post("/auth/register", {
        data: {
          name: newAccount.user.name,
          email: newAccount.user.email,
          password: newAccount.password,
        },
      });

      expect(duplicateResponse.status()).toBe(409);

      const responseBody = (await duplicateResponse.json()) as ApiErrorResponse;

      expect(responseBody).toEqual({
        error: {
          code: "EMAIL_ALREADY_EXISTS",
          message: "Email already exists",
        },
      });
    });

    test("same email with different casing: returns EMAIL_ALREADY_EXISTS", async ({ request }) => {
      const newAccount = buildNewAccount("Case-Insensitive Duplicate User");

      const firstResponse = await request.post("/auth/register", {
        data: {
          name: newAccount.user.name,
          email: newAccount.user.email,
          password: newAccount.password,
        },
      });

      expect(firstResponse.status()).toBe(201);

      const duplicateResponse = await request.post("/auth/register", {
        data: {
          name: newAccount.user.name,
          email: newAccount.user.email.toUpperCase(),
          password: newAccount.password,
        },
      });

      expect(duplicateResponse.status()).toBe(409);

      const responseBody = (await duplicateResponse.json()) as ApiErrorResponse;

      expect(responseBody).toEqual({
        error: {
          code: "EMAIL_ALREADY_EXISTS",
          message: "Email already exists",
        },
      });
    });
  });

  test.describe("validation", () => {
    test("invalid email: returns VALIDATION_ERROR for email", async ({ request }) => {
      const newAccount = buildNewAccount("Invalid Email User");

      const response = await request.post("/auth/register", {
        data: {
          name: newAccount.user.name,
          email: "not-an-email",
          password: newAccount.password,
        },
      });

      expect(response.status()).toBe(400);

      const responseBody = (await response.json()) as ApiErrorResponse;

      expect(responseBody.error.code).toBe("VALIDATION_ERROR");
      expect(responseBody.error.message).toBe("Request validation failed");

      const { details } = responseBody.error;

      assert(Array.isArray(details), "Expected validation error details to be an array");

      const validationIssues: unknown[] = details;

      expect(validationIssues).toHaveLength(1);

      const [validationIssue] = validationIssues;

      expect(validationIssue).toMatchObject({
        path: ["email"],
      });
    });

    test("name containing only spaces: returns VALIDATION_ERROR for name", async ({ request }) => {
      const newAccount = buildNewAccount("Blank Name User");

      const response = await request.post("/auth/register", {
        data: {
          name: "   ",
          email: newAccount.user.email,
          password: newAccount.password,
        },
      });

      expect(response.status()).toBe(400);

      const responseBody = (await response.json()) as ApiErrorResponse;

      expect(responseBody.error.code).toBe("VALIDATION_ERROR");
      expect(responseBody.error.message).toBe("Request validation failed");

      const { details } = responseBody.error;

      assert(Array.isArray(details), "Expected validation error details to be an array");

      const validationIssues: unknown[] = details;

      expect(validationIssues).toHaveLength(1);

      const [validationIssue] = validationIssues;

      expect(validationIssue).toMatchObject({
        path: ["name"],
      });
    });

    test("missing password: returns VALIDATION_ERROR for password", async ({ request }) => {
      const newAccount = buildNewAccount("Missing Password User");

      const response = await request.post("/auth/register", {
        data: {
          name: newAccount.user.name,
          email: newAccount.user.email,
        },
      });

      expect(response.status()).toBe(400);

      const responseBody = (await response.json()) as ApiErrorResponse;

      expect(responseBody.error.code).toBe("VALIDATION_ERROR");
      expect(responseBody.error.message).toBe("Request validation failed");

      const { details } = responseBody.error;

      assert(Array.isArray(details), "Expected validation error details to be an array");

      const validationIssues: unknown[] = details;

      expect(validationIssues).toHaveLength(1);

      const [validationIssue] = validationIssues;

      expect(validationIssue).toMatchObject({
        path: ["password"],
      });
    });

    // The loop creates a separate Playwright test and report entry for each case.
    for (const weakPasswordCase of weakPasswordCases) {
      test(`weak password ${weakPasswordCase.name}: returns VALIDATION_ERROR for password`, async ({
        request,
      }) => {
        const newAccount = {
          ...buildNewAccount("Weak Password User"),
          password: weakPasswordCase.password,
        };

        const response = await request.post("/auth/register", {
          data: {
            name: newAccount.user.name,
            email: newAccount.user.email,
            password: newAccount.password,
          },
        });

        expect(response.status()).toBe(400);

        const responseBody = (await response.json()) as ApiErrorResponse;

        expect(responseBody.error.code).toBe("VALIDATION_ERROR");
        expect(responseBody.error.message).toBe("Request validation failed");

        const { details } = responseBody.error;

        assert(Array.isArray(details), "Expected validation error details to be an array");

        const validationIssues: unknown[] = details;

        expect(validationIssues).toHaveLength(1);

        const [validationIssue] = validationIssues;

        expect(validationIssue).toMatchObject({
          path: ["password"],
        });
      });
    }
  });
});
