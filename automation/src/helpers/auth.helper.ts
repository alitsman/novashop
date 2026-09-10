import type { Page } from "@playwright/test";

import { apiUrl } from "../config/playwright.shared";
import { userSchema } from "../schemas";

import type { AuthUser } from "../types";

type AuthTokenStorageParams = {
  tokenStorageKey: string;
  token: string;
};

const AUTH_TOKEN_STORAGE_KEY = "novashop-auth-token";
const CURRENT_USER_API_URL = new URL("/me", apiUrl).toString();
const SYNTHETIC_AUTH_TOKEN = "synthetic-auth-token";

const storeAuthToken = ({ tokenStorageKey, token }: AuthTokenStorageParams): void => {
  localStorage.setItem(tokenStorageKey, JSON.stringify(token));
};

// Re-applies the token on every document load. Do not use for logout,
// invalid-session, or any test that verifies persistent token removal.
export async function seedAuthTokenForEachPageLoad(page: Page, token: string): Promise<void> {
  await page.addInitScript(storeAuthToken, {
    tokenStorageKey: AUTH_TOKEN_STORAGE_KEY,
    token,
  });
}

// The page must already be on the frontend origin.
// The token is written once and is not restored after the app removes it.
export async function seedAuthTokenOnce(page: Page, token: string): Promise<void> {
  await page.evaluate(storeAuthToken, {
    tokenStorageKey: AUTH_TOKEN_STORAGE_KEY,
    token,
  });
}

export async function readAuthTokenStorageValue(page: Page): Promise<string | null> {
  return page.evaluate(
    (tokenStorageKey) => localStorage.getItem(tokenStorageKey),
    AUTH_TOKEN_STORAGE_KEY,
  );
}

export async function prepareMockedAuthenticatedSession(page: Page, user: AuthUser): Promise<void> {
  const validatedUser = userSchema.parse(user);

  await page.route(CURRENT_USER_API_URL, async (route) => {
    if (route.request().method() !== "GET") {
      await route.abort();

      return;
    }

    await route.fulfill({
      status: 200,
      json: validatedUser,
    });
  });

  await seedAuthTokenForEachPageLoad(page, SYNTHETIC_AUTH_TOKEN);
}
