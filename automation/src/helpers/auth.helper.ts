import type { Page } from "@playwright/test";

const AUTH_TOKEN_STORAGE_KEY = "novashop-auth-token";
const AUTH_USER_STORAGE_KEY = "novashop-auth-user";

const REGULAR_USER = {
  id: "user-1",
  name: "Regular User",
  email: "user@test.com",
  role: "user",
};

const REGULAR_USER_TOKEN = "mock-token-user-1-e2e";

export async function authenticateAsRegularUser(page: Page): Promise<void> {
  await page.addInitScript(
    ({ tokenStorageKey, userStorageKey, token, user }) => {
      localStorage.setItem(tokenStorageKey, JSON.stringify(token));
      localStorage.setItem(userStorageKey, JSON.stringify(user));
    },
    {
      tokenStorageKey: AUTH_TOKEN_STORAGE_KEY,
      userStorageKey: AUTH_USER_STORAGE_KEY,
      token: REGULAR_USER_TOKEN,
      user: REGULAR_USER,
    },
  );
}
