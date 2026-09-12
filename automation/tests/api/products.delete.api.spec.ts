import { expect, test } from "@playwright/test";

import { createProductViaApi, expectSingleValidationError, loginViaApi } from "../../src/helpers";
import { productListSchema, productSchema } from "../../src/schemas";
import { ADMIN_USER, REGULAR_USER } from "../../src/test-data";
import type { ApiErrorResponse } from "../../src/types";

const NONEXISTENT_PRODUCT_ID = "00000000-0000-4000-8000-000000000000";

const INVALID_PRODUCT_ID = "not-a-uuid";

test.describe("DELETE /products/:id", () => {
  test.describe("admin", () => {
    let token: string;

    test.beforeEach(async ({ request }) => {
      token = await loginViaApi(request, ADMIN_USER);
    });

    test("existing product: returns 204 without body", async ({ request }) => {
      const createdProduct = await createProductViaApi(request, token);

      const deleteResponse = await request.delete(`/products/${createdProduct.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(deleteResponse.status()).toBe(204);
      expect(await deleteResponse.text()).toBe("");
    });

    test("deleted product: cannot be retrieved by id", async ({ request }) => {
      const createdProduct = await createProductViaApi(request, token);

      const deleteResponse = await request.delete(`/products/${createdProduct.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(deleteResponse.status()).toBe(204);

      const getResponse = await request.get(`/products/${createdProduct.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(getResponse.status()).toBe(404);

      const responseBody = (await getResponse.json()) as ApiErrorResponse;

      expect(responseBody).toEqual({
        error: {
          code: "PRODUCT_NOT_FOUND",
          message: "Product not found",
        },
      });
    });

    test("deleted product: does not appear in product list", async ({ request }) => {
      const createdProduct = await createProductViaApi(request, token);

      const deleteResponse = await request.delete(`/products/${createdProduct.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(deleteResponse.status()).toBe(204);

      const listResponse = await request.get("/products", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(listResponse.status()).toBe(200);

      const products = productListSchema.parse(await listResponse.json());

      expect(products.map((product) => product.id)).not.toContain(createdProduct.id);
    });

    test("deleted product: repeated delete returns PRODUCT_NOT_FOUND", async ({ request }) => {
      const createdProduct = await createProductViaApi(request, token);

      const firstDeleteResponse = await request.delete(`/products/${createdProduct.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(firstDeleteResponse.status()).toBe(204);

      const secondDeleteResponse = await request.delete(`/products/${createdProduct.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(secondDeleteResponse.status()).toBe(404);

      const responseBody = (await secondDeleteResponse.json()) as ApiErrorResponse;

      expect(responseBody).toEqual({
        error: {
          code: "PRODUCT_NOT_FOUND",
          message: "Product not found",
        },
      });
    });

    test("nonexistent product: returns PRODUCT_NOT_FOUND", async ({ request }) => {
      const deleteResponse = await request.delete(`/products/${NONEXISTENT_PRODUCT_ID}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(deleteResponse.status()).toBe(404);

      const responseBody = (await deleteResponse.json()) as ApiErrorResponse;

      expect(responseBody).toEqual({
        error: {
          code: "PRODUCT_NOT_FOUND",
          message: "Product not found",
        },
      });
    });

    test("invalid id: returns VALIDATION_ERROR for id", async ({ request }) => {
      const deleteResponse = await request.delete(`/products/${INVALID_PRODUCT_ID}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await expectSingleValidationError(deleteResponse, ["id"]);
    });
  });

  test.describe("regular user", () => {
    let regularUserToken: string;

    test.beforeEach(async ({ request }) => {
      regularUserToken = await loginViaApi(request, REGULAR_USER);
    });

    test("existing product: returns FORBIDDEN and leaves product available", async ({
      request,
    }) => {
      const adminToken = await loginViaApi(request, ADMIN_USER);

      const createdProduct = await createProductViaApi(request, adminToken);

      const deleteResponse = await request.delete(`/products/${createdProduct.id}`, {
        headers: {
          Authorization: `Bearer ${regularUserToken}`,
        },
      });

      expect(deleteResponse.status()).toBe(403);

      const responseBody = (await deleteResponse.json()) as ApiErrorResponse;

      expect(responseBody).toEqual({
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        },
      });

      const getResponse = await request.get(`/products/${createdProduct.id}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(getResponse.status()).toBe(200);

      const retrievedProduct = productSchema.parse(await getResponse.json());

      expect(retrievedProduct).toEqual(createdProduct);
    });

    test("invalid id: returns FORBIDDEN before validation", async ({ request }) => {
      const deleteResponse = await request.delete(`/products/${INVALID_PRODUCT_ID}`, {
        headers: {
          Authorization: `Bearer ${regularUserToken}`,
        },
      });

      expect(deleteResponse.status()).toBe(403);

      const responseBody = (await deleteResponse.json()) as ApiErrorResponse;

      expect(responseBody).toEqual({
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        },
      });
    });
  });

  test.describe("without authentication", () => {
    test("existing product: returns AUTHENTICATION_REQUIRED and leaves product available", async ({
      request,
    }) => {
      const adminToken = await loginViaApi(request, ADMIN_USER);

      const createdProduct = await createProductViaApi(request, adminToken);

      const deleteResponse = await request.delete(`/products/${createdProduct.id}`);

      expect(deleteResponse.status()).toBe(401);

      const responseBody = (await deleteResponse.json()) as ApiErrorResponse;

      expect(responseBody).toEqual({
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "Authentication is required",
        },
      });

      const getResponse = await request.get(`/products/${createdProduct.id}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(getResponse.status()).toBe(200);

      const retrievedProduct = productSchema.parse(await getResponse.json());

      expect(retrievedProduct).toEqual(createdProduct);
    });

    test("invalid id: returns AUTHENTICATION_REQUIRED before validation", async ({ request }) => {
      const deleteResponse = await request.delete(`/products/${INVALID_PRODUCT_ID}`);

      expect(deleteResponse.status()).toBe(401);

      const responseBody = (await deleteResponse.json()) as ApiErrorResponse;

      expect(responseBody).toEqual({
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "Authentication is required",
        },
      });
    });
  });
});
