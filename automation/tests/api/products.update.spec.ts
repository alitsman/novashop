import { expect, test } from "@playwright/test";

import {
  createProductViaApi,
  expectSingleProductValidationError,
  loginViaApi,
} from "../../src/helpers";
import { productSchema } from "../../src/schemas";
import { ADMIN_USER, REGULAR_USER } from "../../src/test-data";
import type { ApiErrorResponse } from "../../src/types";

// A valid but absent ID is intentional: body validation must run before product lookup.
const NONEXISTENT_PRODUCT_ID = "00000000-0000-4000-8000-000000000000";

const CLIENT_REQUESTED_PRODUCT_ID = "00000000-0000-4000-8000-000000000099";

const CLIENT_REQUESTED_TIMESTAMP = "2020-01-01T00:00:00.000Z";

const INVALID_PRODUCT_ID = "not-a-uuid";

test.describe("PATCH /products/:id", () => {
  test.describe("admin", () => {
    let token: string;

    test.beforeEach(async ({ request }) => {
      token = await loginViaApi(request, ADMIN_USER);
    });

    test("valid partial data: updates only provided field", async ({
      request,
    }) => {
      const createdProduct = await createProductViaApi(request, token, {
        stock: 5,
      });

      const updateResponse = await request.patch(
        `/products/${createdProduct.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: {
            stock: 15,
          },
        },
      );

      expect(updateResponse.status()).toBe(200);

      const updatedProduct = productSchema.parse(await updateResponse.json());

      expect(updatedProduct).toEqual({
        ...createdProduct,
        stock: 15,
        updatedAt: expect.any(String),
      });

      expect(Date.parse(updatedProduct.updatedAt)).toBeGreaterThan(
        Date.parse(createdProduct.updatedAt),
      );
    });

    test("multiple text fields: maps each value to the correct field", async ({
      request,
    }) => {
      const productUpdateInput = {
        title: "Updated Product Title",
        category: "Updated Category",
        imageUrl: "https://example.com/updated-product.jpg",
        description: "Updated product description for the mapping test.",
      };

      const createdProduct = await createProductViaApi(request, token);

      const updateResponse = await request.patch(
        `/products/${createdProduct.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: productUpdateInput,
        },
      );

      expect(updateResponse.status()).toBe(200);

      const updatedProduct = productSchema.parse(await updateResponse.json());

      expect(updatedProduct).toMatchObject(productUpdateInput);
    });

    test("updated product: can be retrieved by id", async ({ request }) => {
      const productUpdateInput = {
        price: 19.99,
      };

      const createdProduct = await createProductViaApi(request, token);

      const updateResponse = await request.patch(
        `/products/${createdProduct.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: productUpdateInput,
        },
      );

      expect(updateResponse.status()).toBe(200);

      const updatedProduct = productSchema.parse(await updateResponse.json());

      expect(updatedProduct).toMatchObject(productUpdateInput);

      const getResponse = await request.get(`/products/${createdProduct.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(getResponse.status()).toBe(200);

      const retrievedProduct = productSchema.parse(await getResponse.json());

      expect(retrievedProduct).toEqual(updatedProduct);
    });

    test("server-managed fields: ignores client values", async ({
      request,
    }) => {
      const productUpdateInput = {
        stock: 15,
        id: CLIENT_REQUESTED_PRODUCT_ID,
        deletedAt: CLIENT_REQUESTED_TIMESTAMP,
        createdAt: CLIENT_REQUESTED_TIMESTAMP,
        updatedAt: CLIENT_REQUESTED_TIMESTAMP,
      };

      const createdProduct = await createProductViaApi(request, token, {
        stock: 5,
      });

      const updateResponse = await request.patch(
        `/products/${createdProduct.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: productUpdateInput,
        },
      );

      expect(updateResponse.status()).toBe(200);

      const updatedProduct = productSchema.parse(await updateResponse.json());

      expect(updatedProduct).toEqual({
        ...createdProduct,
        stock: 15,
        updatedAt: expect.any(String),
      });

      expect(updatedProduct.updatedAt).not.toBe(CLIENT_REQUESTED_TIMESTAMP);

      expect(updatedProduct).not.toHaveProperty("deletedAt");

      const getResponse = await request.get(`/products/${createdProduct.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(getResponse.status()).toBe(200);
    });

    test("server-managed fields only: returns object-level VALIDATION_ERROR", async ({
      request,
    }) => {
      const updateResponse = await request.patch(
        `/products/${NONEXISTENT_PRODUCT_ID}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: {
            id: CLIENT_REQUESTED_PRODUCT_ID,
            deletedAt: null,
            createdAt: CLIENT_REQUESTED_TIMESTAMP,
            updatedAt: CLIENT_REQUESTED_TIMESTAMP,
          },
        },
      );

      await expectSingleProductValidationError(updateResponse, []);
    });

    test("price with three decimal places: returns VALIDATION_ERROR for price", async ({
      request,
    }) => {
      const updateResponse = await request.patch(
        `/products/${NONEXISTENT_PRODUCT_ID}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: {
            price: 10.999,
          },
        },
      );

      await expectSingleProductValidationError(updateResponse, ["price"]);
    });

    test("invalid id: returns VALIDATION_ERROR for id", async ({ request }) => {
      const updateResponse = await request.patch(
        `/products/${INVALID_PRODUCT_ID}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: {
            stock: 15,
          },
        },
      );

      await expectSingleProductValidationError(updateResponse, ["id"]);
    });

    test("nonexistent product: returns PRODUCT_NOT_FOUND", async ({
      request,
    }) => {
      const updateResponse = await request.patch(
        `/products/${NONEXISTENT_PRODUCT_ID}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: {
            stock: 15,
          },
        },
      );

      expect(updateResponse.status()).toBe(404);

      const responseBody = (await updateResponse.json()) as ApiErrorResponse;

      expect(responseBody).toEqual({
        error: {
          code: "PRODUCT_NOT_FOUND",
          message: "Product not found",
        },
      });
    });

    test("deleted product: cannot be restored or updated", async ({
      request,
    }) => {
      const createdProduct = await createProductViaApi(request, token, {
        stock: 5,
      });

      const deleteResponse = await request.delete(
        `/products/${createdProduct.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(deleteResponse.status()).toBe(204);

      const updateResponse = await request.patch(
        `/products/${createdProduct.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: {
            stock: 15,
            deletedAt: null,
          },
        },
      );

      expect(updateResponse.status()).toBe(404);

      const responseBody = (await updateResponse.json()) as ApiErrorResponse;

      expect(responseBody).toEqual({
        error: {
          code: "PRODUCT_NOT_FOUND",
          message: "Product not found",
        },
      });

      const getResponse = await request.get(`/products/${createdProduct.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(getResponse.status()).toBe(404);
    });
  });

  test.describe("regular user", () => {
    let regularUserToken: string;

    test.beforeEach(async ({ request }) => {
      regularUserToken = await loginViaApi(request, REGULAR_USER);
    });

    test("valid update: returns FORBIDDEN and leaves product unchanged", async ({
      request,
    }) => {
      const adminToken = await loginViaApi(request, ADMIN_USER);

      const createdProduct = await createProductViaApi(request, adminToken, {
        stock: 5,
      });

      const updateResponse = await request.patch(
        `/products/${createdProduct.id}`,
        {
          headers: {
            Authorization: `Bearer ${regularUserToken}`,
          },
          data: {
            stock: 15,
          },
        },
      );

      expect(updateResponse.status()).toBe(403);

      const responseBody = (await updateResponse.json()) as ApiErrorResponse;

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

    test("invalid id and body: returns FORBIDDEN before validation", async ({
      request,
    }) => {
      const updateResponse = await request.patch(
        `/products/${INVALID_PRODUCT_ID}`,
        {
          headers: {
            Authorization: `Bearer ${regularUserToken}`,
          },
          data: {
            price: 10.999,
          },
        },
      );

      expect(updateResponse.status()).toBe(403);

      const responseBody = (await updateResponse.json()) as ApiErrorResponse;

      expect(responseBody).toEqual({
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        },
      });
    });
  });

  test.describe("without authentication", () => {
    test("valid update: returns AUTHENTICATION_REQUIRED and leaves product unchanged", async ({
      request,
    }) => {
      const adminToken = await loginViaApi(request, ADMIN_USER);

      const createdProduct = await createProductViaApi(request, adminToken, {
        stock: 5,
      });

      const updateResponse = await request.patch(
        `/products/${createdProduct.id}`,
        {
          data: {
            stock: 15,
          },
        },
      );

      expect(updateResponse.status()).toBe(401);

      const responseBody = (await updateResponse.json()) as ApiErrorResponse;

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

    test("invalid id and body: returns AUTHENTICATION_REQUIRED before validation", async ({
      request,
    }) => {
      const updateResponse = await request.patch(
        `/products/${INVALID_PRODUCT_ID}`,
        {
          data: {
            price: 10.999,
          },
        },
      );

      expect(updateResponse.status()).toBe(401);

      const responseBody = (await updateResponse.json()) as ApiErrorResponse;

      expect(responseBody).toEqual({
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "Authentication is required",
        },
      });
    });
  });
});
