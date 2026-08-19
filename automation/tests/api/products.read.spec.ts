import assert from "node:assert/strict";

import { expect, test } from "@playwright/test";

import { loginViaApi } from "../../src/helpers";
import {
  ADMIN_USER,
  REGULAR_USER,
  SEEDED_ACTIVE_PRODUCTS,
  SEEDED_REFERENCE_PRODUCT,
  SOFT_DELETED_SEEDED_PRODUCT_ID,
} from "../../src/test-data";
import type { ApiErrorResponse, Product } from "../../src/types";

const SEEDED_ACTIVE_PRODUCT_IDS = SEEDED_ACTIVE_PRODUCTS.map(
  (product) => product.id,
);

const ISO_UTC_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

const unavailableProductCases = [
  {
    name: "unknown valid product id",
    id: "00000000-0000-4000-8000-000000000000",
  },
  {
    name: "soft-deleted product id",
    id: SOFT_DELETED_SEEDED_PRODUCT_ID,
  },
];

const INVALID_PRODUCT_ID = "not-a-uuid";

function getProductById(products: Product[], productId: string): Product {
  const product = products.find((item) => item.id === productId);

  if (product === undefined) {
    throw new Error(`Expected response to contain product ${productId}`);
  }

  return product;
}

test.describe("Products read API", () => {
  test.describe("regular user", () => {
    let token: string;

    test.beforeEach(async ({ request }) => {
      token = await loginViaApi(request, REGULAR_USER);
    });

    test.describe("GET /products", () => {
      test("returns all active seeded products in deterministic order", async ({
        request,
      }) => {
        const response = await request.get("/products", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        expect(response.status()).toBe(200);

        const responseBody = (await response.json()) as Product[];

        const responseProductIds = responseBody.map((product) => product.id);

        // Products created by tests running in parallel are ignored on purpose:
        // the global count is not part of the contract.
        const seededProducts = responseBody.filter((product) =>
          SEEDED_ACTIVE_PRODUCT_IDS.includes(product.id),
        );

        // Check that all seeded products are present and in the correct order.
        // Exact response shape and generated dates are checked separately.
        expect(seededProducts).toEqual(
          SEEDED_ACTIVE_PRODUCTS.map((product) =>
            expect.objectContaining(product),
          ),
        );

        expect(responseProductIds).not.toContain(
          SOFT_DELETED_SEEDED_PRODUCT_ID,
        );
      });

      test("returns the exact public product shape", async ({ request }) => {
        const response = await request.get("/products", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        expect(response.status()).toBe(200);

        const responseBody = (await response.json()) as Product[];

        const actualProduct = getProductById(
          responseBody,
          SEEDED_REFERENCE_PRODUCT.id,
        );

        expect(actualProduct).toEqual({
          ...SEEDED_REFERENCE_PRODUCT,

          // Dates must be present. Their format is checked in a separate test.
          createdAt: expect.anything(),
          updatedAt: expect.anything(),
        });
      });

      test("returns a numeric price and ISO-formatted dates", async ({
        request,
      }) => {
        const response = await request.get("/products", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        expect(response.status()).toBe(200);

        const responseBody = (await response.json()) as Product[];

        const actualProduct = getProductById(
          responseBody,
          SEEDED_REFERENCE_PRODUCT.id,
        );

        expect(typeof actualProduct.price).toBe("number");
        expect(actualProduct.createdAt).toMatch(ISO_UTC_TIMESTAMP_PATTERN);
        expect(actualProduct.updatedAt).toMatch(ISO_UTC_TIMESTAMP_PATTERN);
      });
    });

    test.describe("GET /products/:id", () => {
      test("active product id: returns the requested product", async ({
        request,
      }) => {
        const response = await request.get(
          `/products/${SEEDED_REFERENCE_PRODUCT.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        expect(response.status()).toBe(200);

        const actualProduct = (await response.json()) as Product;

        expect(actualProduct).toEqual({
          ...SEEDED_REFERENCE_PRODUCT,
          createdAt: expect.anything(),
          updatedAt: expect.anything(),
        });
      });

      // The loop creates a separate test for each unavailable product.
      for (const unavailableProductCase of unavailableProductCases) {
        test(`${unavailableProductCase.name}: returns PRODUCT_NOT_FOUND`, async ({
          request,
        }) => {
          const response = await request.get(
            `/products/${unavailableProductCase.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          expect(response.status()).toBe(404);

          const responseBody = (await response.json()) as ApiErrorResponse;

          expect(responseBody).toEqual({
            error: {
              code: "PRODUCT_NOT_FOUND",
              message: "Product not found",
            },
          });
        });
      }

      test("invalid product id: returns VALIDATION_ERROR for id", async ({
        request,
      }) => {
        const response = await request.get(`/products/${INVALID_PRODUCT_ID}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        expect(response.status()).toBe(400);

        const responseBody = (await response.json()) as ApiErrorResponse;

        expect(responseBody.error.code).toBe("VALIDATION_ERROR");
        expect(responseBody.error.message).toBe("Request validation failed");

        const { details } = responseBody.error;

        assert(
          Array.isArray(details),
          "Expected validation error details to be an array",
        );

        const validationIssues: unknown[] = details;

        expect(validationIssues).toHaveLength(1);

        const [validationIssue] = validationIssues;

        expect(validationIssue).toMatchObject({
          path: ["id"],
        });
      });
    });
  });

  test.describe("admin", () => {
    test("GET /products: can get the product list", async ({ request }) => {
      const token = await loginViaApi(request, ADMIN_USER);

      const response = await request.get("/products", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Other tests check the response body. This test only checks admin access.
      expect(response.status()).toBe(200);
    });
  });

  test.describe("without authentication", () => {
    test("GET /products: returns AUTHENTICATION_REQUIRED", async ({
      request,
    }) => {
      const response = await request.get("/products");

      expect(response.status()).toBe(401);

      const responseBody = (await response.json()) as ApiErrorResponse;

      expect(responseBody).toEqual({
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "Authentication is required",
        },
      });
    });

    test("GET /products/:id with invalid id: returns AUTHENTICATION_REQUIRED", async ({
      request,
    }) => {
      // The invalid id proves that authentication runs before id validation.
      const response = await request.get(`/products/${INVALID_PRODUCT_ID}`);

      expect(response.status()).toBe(401);

      const responseBody = (await response.json()) as ApiErrorResponse;

      expect(responseBody).toEqual({
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "Authentication is required",
        },
      });
    });
  });
});
