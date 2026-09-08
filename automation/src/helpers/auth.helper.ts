import type { Page } from "@playwright/test";

import { apiUrl } from "../config/playwright.shared";
import { userSchema } from "../schemas";

import type { AuthUser } from "../types";

const AUTH_TOKEN_STORAGE_KEY = "novashop-auth-token";
const CURRENT_USER_API_URL = new URL("/me", apiUrl).toString();
const SYNTHETIC_AUTH_TOKEN = "synthetic-auth-token";

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

  await page.addInitScript(
    ({ tokenStorageKey, token }) => {
      localStorage.setItem(tokenStorageKey, JSON.stringify(token));
    },
    {
      tokenStorageKey: AUTH_TOKEN_STORAGE_KEY,
      token: SYNTHETIC_AUTH_TOKEN,
    },
  );
}
