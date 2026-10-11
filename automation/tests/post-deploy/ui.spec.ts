import assert from "node:assert/strict";

import { expect, test } from "@playwright/test";
import type { APIRequestContext, Page } from "@playwright/test";

import { LoginPage } from "../../src/pages/login.page";
import { ProductCatalogPage } from "../../src/pages/product-catalog.page";
import { ProductDetailsPage } from "../../src/pages/product-details.page";
import type { AuthResponse, Product } from "../../src/types";

const apiUrl = process.env.DEMO_API_URL;
const smokeEmail = process.env.SMOKE_USER_EMAIL;
const smokePassword = process.env.SMOKE_USER_PASSWORD;
const AUTH_TOKEN_STORAGE_KEY = "novashop-auth-token";

if (!apiUrl || !smokeEmail || !smokePassword) {
  throw new Error("Post-deploy UI smoke environment is incomplete.");
}

const loginViaApi = async (request: APIRequestContext): Promise<string> => {
  const response = await request.post(`${apiUrl}/auth/login`, {
    data: { email: smokeEmail, password: smokePassword },
  });

  if (response.status() !== 200) {
    throw new Error(`Smoke user login failed with status ${response.status()}.`);
  }

  const { token } = (await response.json()) as AuthResponse;
  return token;
};

// Write the token only once, before opening the protected route. Do not import
// auth.helper.ts: it loads playwright.shared.ts and local .env.test settings.
const openWithSmokeSession = async (page: Page, token: string, path: string): Promise<void> => {
  await page.goto("/login");
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: AUTH_TOKEN_STORAGE_KEY,
    value: token,
  });
  await page.goto(path);
};

test("catalog loads real products from the public API", async ({ page, request }) => {
  const token = await loginViaApi(request);
  await openWithSmokeSession(page, token, "/products");

  const catalogPage = new ProductCatalogPage(page);
  await expect(catalogPage.heading).toBeVisible();
  await expect(catalogPage.productCards.first()).toBeVisible();
  await expect(catalogPage.errorAlert).toBeHidden();
});

test("direct product details URL works on Cloudflare Pages", async ({ page, request }) => {
  const token = await loginViaApi(request);
  const response = await request.get(`${apiUrl}/products`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(response.status()).toBe(200);

  const products = (await response.json()) as Product[];
  expect(products.length).toBeGreaterThan(0);

  const [product] = products;
  assert(product, "No available product for direct URL smoke test.");

  await openWithSmokeSession(page, token, `/products/${product.id}`);

  const detailsPage = new ProductDetailsPage(page);
  await expect(detailsPage.heading).toHaveText(product.title);
  await expect(detailsPage.productContent).toBeVisible();
});

test("smoke user can sign in through the frontend", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.open();
  await expect(loginPage.heading).toBeVisible();

  await loginPage.signIn(smokeEmail, smokePassword);

  await expect(page).toHaveURL(/\/products$/);

  const catalogPage = new ProductCatalogPage(page);
  await expect(catalogPage.heading).toBeVisible();
  await expect(catalogPage.header.logoutButton).toBeVisible();
  await expect(catalogPage.header.manageProducts).toBeHidden();
});

test("guest is redirected to login from a protected route", async ({ page }) => {
  // A fresh Playwright page/context has no authentication storage.
  await page.goto("/orders");

  await expect(page).toHaveURL(/\/login$/);
  await expect(new LoginPage(page).heading).toBeVisible();
});
