import { expect, test } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";

import type { AuthResponse, Product } from "../../src/types";

const apiUrl = process.env.DEMO_API_URL;
const smokeEmail = process.env.SMOKE_USER_EMAIL;
const smokePassword = process.env.SMOKE_USER_PASSWORD;

if (!apiUrl || !smokeEmail || !smokePassword) {
  throw new Error("Post-deploy API smoke environment is incomplete.");
}

test.use({ baseURL: apiUrl });

const login = async (request: APIRequestContext): Promise<AuthResponse> => {
  const response = await request.post("/auth/login", {
    data: { email: smokeEmail, password: smokePassword },
  });

  if (response.status() !== 200) {
    throw new Error(`Smoke user login failed with status ${response.status()}.`);
  }

  return (await response.json()) as AuthResponse;
};

test("database health is connected", async ({ request }) => {
  const response = await request.get("/health/db");

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({
    status: "ok",
    service: "novashop-backend",
    database: "connected",
  });
});

test("smoke user can read a non-empty product catalog", async ({ request }) => {
  const { token } = await login(request);
  const response = await request.get("/products", {
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(response.status()).toBe(200);

  const products = (await response.json()) as Product[];
  expect(Array.isArray(products)).toBe(true);
  expect(products.length).toBeGreaterThan(0);
});

test("smoke user login works and /me returns their identity", async ({ request }) => {
  const { token, user } = await login(request);

  expect(token).toEqual(expect.any(String));
  expect(token.length).toBeGreaterThan(0);
  expect(user.email).toBe(smokeEmail);
  expect(user.role).toBe("user");

  const response = await request.get("/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({
    id: user.id,
    email: smokeEmail,
    role: "user",
  });
});

test("smoke user cannot create an admin product", async ({ request }) => {
  const { token } = await login(request);
  const response = await request.post("/products", {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Authorization runs before request validation and before any database mutation.
  expect(response.status()).toBe(403);
});
