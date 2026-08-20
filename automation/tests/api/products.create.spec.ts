import assert from "node:assert/strict";

import { expect, test } from "@playwright/test";
import type { APIResponse } from "@playwright/test";

import { loginViaApi } from "../../src/helpers";
import { productSchema } from "../../src/schemas";
import {
  ADMIN_USER,
  REGULAR_USER,
  createProductInput,
} from "../../src/test-data";
import type { Product, ApiErrorResponse } from "../../src/types";

const validTextBoundaryCases = [
  {
    name: "title at minimum length",
    field: "title",
    value: "ab",
  },
  {
    name: "title at maximum length",
    field: "title",
    value: "a".repeat(80),
  },
  {
    name: "category at minimum length",
    field: "category",
    value: "ab",
  },
  {
    name: "category at maximum length",
    field: "category",
    value: "a".repeat(40),
  },
  {
    name: "description at minimum length",
    field: "description",
    value: "a".repeat(10),
  },
  {
    name: "description at maximum length",
    field: "description",
    value: "a".repeat(300),
  },
];

const validNumericBoundaryCases = [
  {
    name: "price at minimum valid value",
    field: "price",
    value: 0.01,
  },
  {
    name: "price at maximum",
    field: "price",
    value: 999_999,
  },
  {
    name: "stock at minimum",
    field: "stock",
    value: 0,
  },
  {
    name: "stock at maximum",
    field: "stock",
    value: 100_000,
  },
];

const invalidPriceCases = [
  {
    name: "equal to zero",
    value: 0,
  },
  {
    name: "greater than maximum",
    value: 1_000_000,
  },
  {
    name: "with three decimal places",
    value: 10.999,
  },
];

const invalidStockCases = [
  {
    name: "less than zero",
    value: -1,
  },
  {
    name: "greater than maximum",
    value: 100_001,
  },
  {
    name: "with decimal value",
    value: 1.5,
  },
];

const invalidTitleCases = [
  {
    name: "shorter than minimum",
    value: "a",
  },
  {
    name: "longer than maximum",
    value: "a".repeat(81),
  },
  {
    name: "without letters or digits",
    value: "---",
  },
  {
    name: "with angle brackets",
    value: "Valid <title>",
  },
  {
    name: "with control character",
    value: "Valid\u0000Title",
  },
];

const invalidCategoryCases = [
  {
    name: "shorter than minimum",
    value: "a",
  },
  {
    name: "longer than maximum",
    value: "a".repeat(41),
  },
  {
    name: "without letters or digits",
    value: "---",
  },
  {
    name: "with angle brackets",
    value: "Valid <category>",
  },
  {
    name: "with control character",
    value: "Valid\u0000Category",
  },
];

const invalidDescriptionCases = [
  {
    name: "shorter than minimum",
    value: "Short1234",
  },
  {
    name: "longer than maximum",
    value: "a".repeat(301),
  },
  {
    name: "without letters or digits",
    value: "----------",
  },
  {
    name: "with angle brackets",
    value: "Valid <description> text",
  },
  {
    name: "with control character",
    value: "Valid\u0000description",
  },
];

const invalidImageUrlCases = [
  {
    name: "with invalid URL",
    value: "not-a-url",
  },
  {
    name: "with unsupported protocol",
    value: "ftp://example.com/image.jpg",
  },
];

const invalidProductFieldTypeCases = [
  {
    field: "title",
    value: 123,
  },
  {
    field: "price",
    value: "9.99",
  },
  {
    field: "category",
    value: 123,
  },
  {
    field: "imageUrl",
    value: 123,
  },
  {
    field: "description",
    value: 123,
  },
  {
    field: "stock",
    value: "10",
  },
];

const requiredProductFields = [
  "title",
  "price",
  "category",
  "imageUrl",
  "description",
  "stock",
] as const;

const emptyStringProductFields = [
  "title",
  "category",
  "imageUrl",
  "description",
];

// Keep this helper local because only this spec uses it.
// Each caller violates one rule, so exactly one issue is expected.
// Empty-string cases can violate several rules and keep separate assertions.
async function expectSingleValidationErrorForField(
  response: APIResponse,
  field: string,
): Promise<void> {
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
    path: [field],
  });
}

test.describe("POST /products", () => {
  test.describe("admin", () => {
    let token: string;

    test.beforeEach(async ({ request }) => {
      token = await loginViaApi(request, ADMIN_USER);
    });

    test("valid data: creates and returns the product", async ({ request }) => {
      const newProductInput = createProductInput({
        title: "New Product",
      });

      const response = await request.post("/products", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: newProductInput,
      });

      expect(response.status()).toBe(201);

      const createdProduct = productSchema.parse(await response.json());

      expect(createdProduct).toEqual({
        ...newProductInput,
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    for (const validTextBoundaryCase of validTextBoundaryCases) {
      test(`${validTextBoundaryCase.name}: creates product`, async ({
        request,
      }) => {
        const requestBody = {
          ...createProductInput(),
          [validTextBoundaryCase.field]: validTextBoundaryCase.value,
        };

        const response = await request.post("/products", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: requestBody,
        });

        expect(response.status()).toBe(201);
      });
    }

    for (const validNumericBoundaryCase of validNumericBoundaryCases) {
      test(`${validNumericBoundaryCase.name}: creates product`, async ({
        request,
      }) => {
        const requestBody = {
          ...createProductInput(),
          [validNumericBoundaryCase.field]: validNumericBoundaryCase.value,
        };

        const response = await request.post("/products", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: requestBody,
        });

        expect(response.status()).toBe(201);
      });
    }

    test("imageUrl with HTTP protocol: creates product", async ({
      request,
    }) => {
      const requestBody = createProductInput({
        imageUrl: "http://example.com/product.jpg",
      });

      const response = await request.post("/products", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: requestBody,
      });

      expect(response.status()).toBe(201);
    });

    test("created product: can be retrieved by id", async ({ request }) => {
      const newProductInput = createProductInput({
        title: "New Product",
      });

      const createResponse = await request.post("/products", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: newProductInput,
      });

      expect(createResponse.status()).toBe(201);

      const createdProduct = (await createResponse.json()) as Product;

      const getResponse = await request.get(`/products/${createdProduct.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(getResponse.status()).toBe(200);

      const actualProduct = (await getResponse.json()) as Product;

      expect(actualProduct).toEqual(createdProduct);
    });

    test("created product: appears in the product list", async ({
      request,
    }) => {
      const newProductInput = createProductInput({
        title: "New Product",
      });

      const createResponse = await request.post("/products", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: newProductInput,
      });

      expect(createResponse.status()).toBe(201);

      const createdProduct = (await createResponse.json()) as Product;

      const getResponse = await request.get("/products", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(getResponse.status()).toBe(200);

      const productsList = (await getResponse.json()) as Product[];

      const productListIds = productsList.map((product) => product.id);

      expect(productListIds).toContain(createdProduct.id);
    });

    test("server-managed fields: ignores client values", async ({
      request,
    }) => {
      const requestedId = "00000000-0000-4000-8000-000000000099";
      const requestedTimestamp = "2020-01-01T00:00:00.000Z";

      const productInput = createProductInput({
        title: "New Product with server-managed fields",
      });

      const requestBody = {
        ...productInput,
        id: requestedId,
        deletedAt: requestedTimestamp,
        createdAt: requestedTimestamp,
        updatedAt: requestedTimestamp,
      };

      const response = await request.post("/products", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: requestBody,
      });

      expect(response.status()).toBe(201);

      const createdProduct = (await response.json()) as Product;

      expect(createdProduct.id).not.toBe(requestedId);
      expect(createdProduct.createdAt).not.toBe(requestedTimestamp);
      expect(createdProduct.updatedAt).not.toBe(requestedTimestamp);
      expect(createdProduct).not.toHaveProperty("deletedAt");

      const getResponse = await request.get(`/products/${createdProduct.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(getResponse.status()).toBe(200);
    });

    for (const invalidPriceCase of invalidPriceCases) {
      test(`price ${invalidPriceCase.name}: returns VALIDATION_ERROR for price`, async ({
        request,
      }) => {
        const newProductInput = createProductInput({
          price: invalidPriceCase.value,
        });

        const response = await request.post("/products", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: newProductInput,
        });

        await expectSingleValidationErrorForField(response, "price");
      });
    }

    for (const invalidStockCase of invalidStockCases) {
      test(`stock ${invalidStockCase.name}: returns VALIDATION_ERROR for stock`, async ({
        request,
      }) => {
        const newProductInput = createProductInput({
          stock: invalidStockCase.value,
        });

        const response = await request.post("/products", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: newProductInput,
        });

        await expectSingleValidationErrorForField(response, "stock");
      });
    }

    for (const invalidTitleCase of invalidTitleCases) {
      test(`title ${invalidTitleCase.name}: returns VALIDATION_ERROR for title`, async ({
        request,
      }) => {
        const newProductInput = createProductInput({
          title: invalidTitleCase.value,
        });

        const response = await request.post("/products", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: newProductInput,
        });

        await expectSingleValidationErrorForField(response, "title");
      });
    }

    for (const invalidCategoryCase of invalidCategoryCases) {
      test(`category ${invalidCategoryCase.name}: returns VALIDATION_ERROR for category`, async ({
        request,
      }) => {
        const newProductInput = createProductInput({
          category: invalidCategoryCase.value,
        });

        const response = await request.post("/products", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: newProductInput,
        });

        await expectSingleValidationErrorForField(response, "category");
      });
    }

    for (const invalidDescriptionCase of invalidDescriptionCases) {
      test(`description ${invalidDescriptionCase.name}: returns VALIDATION_ERROR for description`, async ({
        request,
      }) => {
        const newProductInput = createProductInput({
          description: invalidDescriptionCase.value,
        });

        const response = await request.post("/products", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: newProductInput,
        });

        await expectSingleValidationErrorForField(response, "description");
      });
    }

    for (const invalidImageUrlCase of invalidImageUrlCases) {
      test(`imageUrl ${invalidImageUrlCase.name}: returns VALIDATION_ERROR for imageUrl`, async ({
        request,
      }) => {
        const newProductInput = createProductInput({
          imageUrl: invalidImageUrlCase.value,
        });

        const response = await request.post("/products", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: newProductInput,
        });

        await expectSingleValidationErrorForField(response, "imageUrl");
      });
    }

    for (const invalidTypeCase of invalidProductFieldTypeCases) {
      test(`${invalidTypeCase.field} with wrong type: returns VALIDATION_ERROR for ${invalidTypeCase.field}`, async ({
        request,
      }) => {
        const requestBody: Record<string, unknown> = {
          ...createProductInput(),
          [invalidTypeCase.field]: invalidTypeCase.value,
        };

        const response = await request.post("/products", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: requestBody,
        });

        await expectSingleValidationErrorForField(
          response,
          invalidTypeCase.field,
        );
      });
    }

    for (const requiredProductField of requiredProductFields) {
      test(`without ${requiredProductField}: returns VALIDATION_ERROR for ${requiredProductField}`, async ({
        request,
      }) => {
        const requestBody = {
          ...createProductInput(),
        };

        delete requestBody[requiredProductField];

        const response = await request.post("/products", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: requestBody,
        });

        await expectSingleValidationErrorForField(
          response,
          requiredProductField,
        );
      });
    }

    for (const emptyStringProductField of emptyStringProductFields) {
      test(`${emptyStringProductField} with empty string: returns VALIDATION_ERROR for ${emptyStringProductField}`, async ({
        request,
      }) => {
        const requestBody = {
          ...createProductInput(),
          [emptyStringProductField]: "",
        };

        const response = await request.post("/products", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: requestBody,
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

        // An empty string can produce several issues, so the exact count does not matter.
        expect(validationIssues).not.toHaveLength(0);

        const [validationIssue] = validationIssues;

        expect(validationIssue).toMatchObject({
          path: [emptyStringProductField],
        });
      });
    }
  });

  test.describe("regular user", () => {
    test("returns FORBIDDEN before validating product input", async ({
      request,
    }) => {
      const token = await loginViaApi(request, REGULAR_USER);

      const response = await request.post("/products", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {},
      });

      expect(response.status()).toBe(403);

      const responseBody = (await response.json()) as ApiErrorResponse;

      expect(responseBody).toEqual({
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        },
      });
    });
  });

  test.describe("without authentication", () => {
    test("returns AUTHENTICATION_REQUIRED before validating product input", async ({
      request,
    }) => {
      const response = await request.post("/products", {
        data: {},
      });

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
