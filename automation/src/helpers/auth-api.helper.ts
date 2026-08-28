import { randomUUID } from "node:crypto";

import type { APIRequestContext } from "@playwright/test";

import type { AuthResponse, TestAccount } from "../types";

// Registers an isolated regular user through the public API for tests that need
// user-owned setup data but do not test POST /auth/register itself.
export async function registerUserViaApi(request: APIRequestContext): Promise<AuthResponse> {
  const userEmail = `user-${randomUUID()}@test.com`;

  const response = await request.post("/auth/register", {
    data: {
      name: "New Test User",
      email: userEmail,
      password: "UserPass123!",
    },
  });

  if (response.status() !== 201) {
    throw new Error(`User registration failed: expected status 201, received ${response.status()}`);
  }

  return (await response.json()) as AuthResponse;
}

export async function loginViaApi(
  request: APIRequestContext,
  account: TestAccount,
): Promise<string> {
  const response = await request.post("/auth/login", {
    data: {
      email: account.user.email,
      password: account.password,
    },
  });

  if (!response.ok()) {
    throw new Error(
      `API login failed for ${account.user.email}: received status ${response.status()}`,
    );
  }

  const responseBody = (await response.json()) as AuthResponse;
  const { token } = responseBody;

  return token;
}
