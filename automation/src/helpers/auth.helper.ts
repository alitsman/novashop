import type { Page } from "@playwright/test";

import type { TestAccount } from "../types";

const AUTH_TOKEN_STORAGE_KEY = "novashop-auth-token";
const AUTH_USER_STORAGE_KEY = "novashop-auth-user";

export async function authenticateUser(page: Page, account: TestAccount): Promise<void> {
  const token = `mock-token-${account.user.id}-e2e`;

  await page.addInitScript(
    ({ tokenStorageKey, userStorageKey, token, user }) => {
      localStorage.setItem(tokenStorageKey, JSON.stringify(token));
      localStorage.setItem(userStorageKey, JSON.stringify(user));
    },
    {
      tokenStorageKey: AUTH_TOKEN_STORAGE_KEY,
      userStorageKey: AUTH_USER_STORAGE_KEY,
      token,
      user: account.user,
    },
  );
}
