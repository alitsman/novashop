import type { APIRequestContext } from "@playwright/test";
import type { LoginResponse, TestAccount } from "../types";

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

  const responseBody = (await response.json()) as LoginResponse;
  const { token } = responseBody;

  return token;
}
