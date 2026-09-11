import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

import {
  createProductViaApi,
  expectSingleValidationError,
  loginViaApi,
  registerUserViaApi,
} from "../../src/helpers";
import { orderListSchema, orderSchema, productSchema } from "../../src/schemas";
import { ADMIN_USER, createOrderInput, createOrderItemInput } from "../../src/test-data";
import type { ApiErrorResponse, AuthResponse, CreateOrderInput } from "../../src/types";

const invalidFullNameCases = [
  {
    name: "shorter than minimum",
    value: "A",
  },
  {
    name: "longer than maximum",
    value: "A".repeat(81),
  },
  {
    name: "without letters",
    value: "--",
  },
  {
    name: "with unsupported character",
    value: "Test_User",
  },
  {
    name: "with angle bracket",
    value: "Test<User",
  },
  {
    name: "with control character",
    value: "Test\u0000User",
  },
];

const invalidPhoneCases = [
  {
    name: "with unsupported character",
    value: "+995 555 ABC 123",
  },
  {
    name: "with two plus signs",
    value: "+995+5551234",
  },
  {
    name: "with plus sign outside the beginning",
    value: "995+5551234",
  },
  {
    name: "with fewer than 7 digits",
    value: "+123 456",
  },
  {
    name: "with more than 15 digits",
    value: "+1234567890123456",
  },
  {
    name: "with control character",
    value: "+995 555\v1234",
  },
];

const invalidAddressCases = [
  {
    name: "shorter than minimum",
    value: "A123",
  },
  {
    name: "longer than maximum",
    value: "A".repeat(201),
  },
  {
    name: "without letters or digits",
    value: "---..",
  },
  {
    name: "with angle bracket",
    value: "Test <address>",
  },
  {
    name: "with control character",
    value: "Test\u0000Address",
  },
];

const invalidOrderEnumCases = [
  {
    field: "deliveryMethod",
    value: "drone",
  },
  {
    field: "paymentMethod",
    value: "crypto",
  },
];

const invalidOrderItemQuantityCases = [
  {
    name: "equal to zero",
    value: 0,
  },
  {
    name: "with decimal value",
    value: 1.5,
  },
  {
    name: "greater than maximum",
    value: 100_001,
  },
];

const duplicateProductId = randomUUID();
const lowercaseDuplicateProductId = randomUUID();
const uppercaseDuplicateProductId = lowercaseDuplicateProductId.toUpperCase();

const duplicateOrderItemsCases = [
  {
    name: "with the same productId",
    value: [
      createOrderItemInput(duplicateProductId, 1),
      createOrderItemInput(duplicateProductId, 2),
    ],
  },
  {
    name: "with the same productId in different casing",
    value: [
      createOrderItemInput(lowercaseDuplicateProductId, 1),
      createOrderItemInput(uppercaseDuplicateProductId, 2),
    ],
  },
];

const validOrderTextBoundaryCases = [
  {
    name: "fullName at minimum length",
    field: "fullName",
    value: "Al",
  },
  {
    name: "fullName at maximum length",
    field: "fullName",
    value: "A".repeat(80),
  },
  {
    name: "phone at minimum digit count",
    field: "phone",
    value: "+1234567",
  },
  {
    name: "phone at maximum digit count",
    field: "phone",
    value: "+123456789012345",
  },
  {
    name: "address at minimum length",
    field: "address",
    value: "A1234",
  },
  {
    name: "address at maximum length",
    field: "address",
    value: "A".repeat(200),
  },
];

test.describe("POST /orders", () => {
  test.describe("authenticated user", () => {
    let regularUserAuth: AuthResponse;

    test.beforeEach(async ({ request }) => {
      regularUserAuth = await registerUserViaApi(request);
    });

    test("single item: creates and returns the order", async ({ request }) => {
      const adminToken = await loginViaApi(request, ADMIN_USER);

      const testProduct = await createProductViaApi(request, adminToken, {
        title: "Single Item Order Product",
        price: 12.5,
        stock: 10,
      });

      const orderedQuantity = 2;
      const orderItemInput = createOrderItemInput(testProduct.id, orderedQuantity);
      const orderInput = createOrderInput([orderItemInput]);

      const response = await request.post("/orders", {
        headers: {
          Authorization: `Bearer ${regularUserAuth.token}`,
        },
        data: orderInput,
      });

      expect(response.status()).toBe(201);

      const createdOrder = orderSchema.parse(await response.json());

      const expectedTotalPrice = testProduct.price * orderedQuantity;

      expect(createdOrder).toMatchObject({
        userId: regularUserAuth.user.id,
        totalPrice: expectedTotalPrice,
        fullName: orderInput.fullName,
        phone: orderInput.phone,
        address: orderInput.address,
        deliveryMethod: orderInput.deliveryMethod,
        paymentMethod: orderInput.paymentMethod,
      });

      expect(createdOrder.items).toEqual([
        {
          productId: testProduct.id,
          title: testProduct.title,
          price: testProduct.price,
          quantity: orderedQuantity,
        },
      ]);
    });

    test("ordered quantity: decreases product stock by the exact amount", async ({ request }) => {
      const initialStock = 10;
      const orderedQuantity = 3;

      const adminToken = await loginViaApi(request, ADMIN_USER);

      const testProduct = await createProductViaApi(request, adminToken, {
        title: "Stock Decrement Order Product",
        stock: initialStock,
      });

      const orderInput = createOrderInput([createOrderItemInput(testProduct.id, orderedQuantity)]);

      const orderResponse = await request.post("/orders", {
        headers: {
          Authorization: `Bearer ${regularUserAuth.token}`,
        },
        data: orderInput,
      });

      expect(orderResponse.status()).toBe(201);

      const productResponse = await request.get(`/products/${testProduct.id}`, {
        headers: {
          Authorization: `Bearer ${regularUserAuth.token}`,
        },
      });

      expect(productResponse.status()).toBe(200);

      const updatedProduct = productSchema.parse(await productResponse.json());

      expect(updatedProduct.stock).toBe(initialStock - orderedQuantity);
    });

    test("multiple items: preserves non-id request order and calculates the exact total", async ({
      request,
    }) => {
      const initialStock = 10;
      const adminToken = await loginViaApi(request, ADMIN_USER);

      const firstProduct = await createProductViaApi(request, adminToken, {
        title: "Multi Item First Product",
        price: 19.99,
        stock: initialStock,
      });

      const secondProduct = await createProductViaApi(request, adminToken, {
        title: "Multi Item Second Product",
        price: 0.1,
        stock: initialStock,
      });

      const thirdProduct = await createProductViaApi(request, adminToken, {
        title: "Multi Item Third Product",
        price: 1,
        stock: initialStock,
      });

      // Sort the products by id so their id order is known.
      const productsByIdAscending = [firstProduct, secondProduct, thirdProduct].sort(
        (first, second) => first.id.localeCompare(second.id),
      );

      // Send [middle, lowest, highest] so id sorting cannot match the request.
      const requestedProducts = [
        productsByIdAscending[1],
        productsByIdAscending[0],
        productsByIdAscending[2],
      ];

      const quantityByProductId = {
        [firstProduct.id]: 3,
        [secondProduct.id]: 8,
        [thirdProduct.id]: 1,
      };

      const orderInput = createOrderInput(
        requestedProducts.map((product) =>
          createOrderItemInput(product.id, quantityByProductId[product.id]),
        ),
      );

      const userHeaders = {
        Authorization: `Bearer ${regularUserAuth.token}`,
      };

      const orderResponse = await request.post("/orders", {
        headers: userHeaders,
        data: orderInput,
      });

      expect(orderResponse.status()).toBe(201);

      const createdOrder = orderSchema.parse(await orderResponse.json());

      // 19.99 * 3 + 0.10 * 8 + 1.00 * 1 = 61.77.
      // A direct floating-point sum gives 61.769999999999996.
      expect(createdOrder.totalPrice).toBe(61.77);

      expect(createdOrder.items).toEqual(
        requestedProducts.map((product) => ({
          productId: product.id,
          title: product.title,
          price: product.price,
          quantity: quantityByProductId[product.id],
        })),
      );

      // Different quantities check that each product gets the correct stock update.
      const [firstProductResponse, secondProductResponse, thirdProductResponse] = await Promise.all(
        [
          request.get(`/products/${firstProduct.id}`, {
            headers: userHeaders,
          }),
          request.get(`/products/${secondProduct.id}`, {
            headers: userHeaders,
          }),
          request.get(`/products/${thirdProduct.id}`, {
            headers: userHeaders,
          }),
        ],
      );

      expect(firstProductResponse.status()).toBe(200);
      expect(secondProductResponse.status()).toBe(200);
      expect(thirdProductResponse.status()).toBe(200);

      const updatedFirstProduct = productSchema.parse(await firstProductResponse.json());
      const updatedSecondProduct = productSchema.parse(await secondProductResponse.json());
      const updatedThirdProduct = productSchema.parse(await thirdProductResponse.json());

      expect(updatedFirstProduct.stock).toBe(initialStock - quantityByProductId[firstProduct.id]);
      expect(updatedSecondProduct.stock).toBe(initialStock - quantityByProductId[secondProduct.id]);
      expect(updatedThirdProduct.stock).toBe(initialStock - quantityByProductId[thirdProduct.id]);
    });

    test("multiple items: preserves non-alphabetical request order", async ({ request }) => {
      const adminToken = await loginViaApi(request, ADMIN_USER);

      const alphaProduct = await createProductViaApi(request, adminToken, {
        title: "Alphabetical Alpha Product",
      });

      const bravoProduct = await createProductViaApi(request, adminToken, {
        title: "Alphabetical Bravo Product",
      });

      const charlieProduct = await createProductViaApi(request, adminToken, {
        title: "Alphabetical Charlie Product",
      });

      // Send [Charlie, Alpha, Bravo] so title sorting cannot match the request.
      // The previous test checks product id sorting.
      const requestedProducts = [charlieProduct, alphaProduct, bravoProduct];

      const orderInput = createOrderInput(
        requestedProducts.map((product) => createOrderItemInput(product.id, 1)),
      );

      const orderResponse = await request.post("/orders", {
        headers: {
          Authorization: `Bearer ${regularUserAuth.token}`,
        },
        data: orderInput,
      });

      expect(orderResponse.status()).toBe(201);

      const createdOrder = orderSchema.parse(await orderResponse.json());

      expect(createdOrder.items.map((item) => item.productId)).toEqual(
        requestedProducts.map((product) => product.id),
      );
    });

    test("client-provided item data: uses product title and price from the database", async ({
      request,
    }) => {
      const orderedQuantity = 2;
      const adminToken = await loginViaApi(request, ADMIN_USER);

      const testProduct = await createProductViaApi(request, adminToken, {
        title: "Database Order Product",
        price: 49.99,
        stock: 10,
      });

      const clientOrderItem = {
        ...createOrderItemInput(testProduct.id, orderedQuantity),
        title: "Hacked Product",
        price: 0.01,
      };

      const orderInput = createOrderInput([clientOrderItem]);

      const orderResponse = await request.post("/orders", {
        headers: {
          Authorization: `Bearer ${regularUserAuth.token}`,
        },
        data: orderInput,
      });

      expect(orderResponse.status()).toBe(201);

      const createdOrder = orderSchema.parse(await orderResponse.json());

      // Database price 49.99 * quantity 2 = 99.98.
      expect(createdOrder.totalPrice).toBe(99.98);

      expect(createdOrder.items).toEqual([
        {
          productId: testProduct.id,
          title: testProduct.title,
          price: testProduct.price,
          quantity: orderedQuantity,
        },
      ]);
    });

    test("client-provided userId: creates the order for the authenticated user", async ({
      request,
    }) => {
      const anotherUserAuth = await registerUserViaApi(request);
      const adminToken = await loginViaApi(request, ADMIN_USER);

      const testProduct = await createProductViaApi(request, adminToken, {
        title: "Order Ownership Product",
      });

      // Send another real user's id to prove that the request body cannot choose the owner.
      const orderInput = {
        ...createOrderInput([createOrderItemInput(testProduct.id, 1)]),
        userId: anotherUserAuth.user.id,
      };

      const orderResponse = await request.post("/orders", {
        headers: {
          Authorization: `Bearer ${regularUserAuth.token}`,
        },
        data: orderInput,
      });

      expect(orderResponse.status()).toBe(201);

      const createdOrder = orderSchema.parse(await orderResponse.json());

      expect(createdOrder.userId).toBe(regularUserAuth.user.id);
    });

    test("client-provided orderNumber: ignores it and assigns different server numbers", async ({
      request,
    }) => {
      const adminToken = await loginViaApi(request, ADMIN_USER);

      const testProduct = await createProductViaApi(request, adminToken, {
        title: "Server Order Number Product",
        stock: 10,
      });

      // Zero cannot be a valid server order number, so it clearly shows whether
      // the client value was ignored.
      const clientRequestedOrderNumber = 0;
      const orderInput = {
        ...createOrderInput([createOrderItemInput(testProduct.id, 1)]),
        orderNumber: clientRequestedOrderNumber,
      };

      const firstOrderResponse = await request.post("/orders", {
        headers: {
          Authorization: `Bearer ${regularUserAuth.token}`,
        },
        data: orderInput,
      });

      const secondOrderResponse = await request.post("/orders", {
        headers: {
          Authorization: `Bearer ${regularUserAuth.token}`,
        },
        data: orderInput,
      });

      expect(firstOrderResponse.status()).toBe(201);
      expect(secondOrderResponse.status()).toBe(201);

      const firstOrder = orderSchema.parse(await firstOrderResponse.json());
      const secondOrder = orderSchema.parse(await secondOrderResponse.json());

      expect(firstOrder.orderNumber).not.toBe(clientRequestedOrderNumber);
      expect(secondOrder.orderNumber).not.toBe(clientRequestedOrderNumber);
      expect(firstOrder.orderNumber).not.toBe(secondOrder.orderNumber);
    });

    test("missing product: returns PRODUCT_NOT_FOUND with the missing id", async ({ request }) => {
      // A random valid UUID passes request validation but does not match a product.
      const missingProductId = randomUUID();

      const orderInput = createOrderInput([createOrderItemInput(missingProductId, 1)]);

      const orderResponse = await request.post("/orders", {
        headers: {
          Authorization: `Bearer ${regularUserAuth.token}`,
        },
        data: orderInput,
      });

      expect(orderResponse.status()).toBe(404);

      const errorResponse = (await orderResponse.json()) as ApiErrorResponse;

      expect(errorResponse).toEqual({
        error: {
          code: "PRODUCT_NOT_FOUND",
          message: "Product not found",
          details: {
            missingProductIds: [missingProductId],
          },
        },
      });
    });

    test("multiple missing products: returns every missing id", async ({ request }) => {
      const firstMissingProductId = randomUUID();
      const secondMissingProductId = randomUUID();

      const orderInput = createOrderInput([
        createOrderItemInput(firstMissingProductId, 1),
        createOrderItemInput(secondMissingProductId, 1),
      ]);

      const orderResponse = await request.post("/orders", {
        headers: {
          Authorization: `Bearer ${regularUserAuth.token}`,
        },
        data: orderInput,
      });

      expect(orderResponse.status()).toBe(404);

      const errorResponse = (await orderResponse.json()) as ApiErrorResponse;

      expect(errorResponse.error.code).toBe("PRODUCT_NOT_FOUND");
      expect(errorResponse.error.message).toBe("Product not found");

      const { details } = errorResponse.error;

      assert(
        typeof details === "object" &&
          details !== null &&
          "missingProductIds" in details &&
          Array.isArray(details.missingProductIds),
        "Expected error details to contain a missingProductIds array",
      );

      const missingProductIds: unknown[] = details.missingProductIds;

      expect(missingProductIds).toHaveLength(2);
      expect(missingProductIds).toEqual(
        expect.arrayContaining([firstMissingProductId, secondMissingProductId]),
      );
    });

    test("deleted product: returns PRODUCT_NOT_FOUND with the deleted id", async ({ request }) => {
      const adminToken = await loginViaApi(request, ADMIN_USER);

      const testProduct = await createProductViaApi(request, adminToken, {
        title: "Deleted Order Product",
      });

      const deleteResponse = await request.delete(`/products/${testProduct.id}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(deleteResponse.status()).toBe(204);

      const orderInput = createOrderInput([createOrderItemInput(testProduct.id, 1)]);

      const orderResponse = await request.post("/orders", {
        headers: {
          Authorization: `Bearer ${regularUserAuth.token}`,
        },
        data: orderInput,
      });

      expect(orderResponse.status()).toBe(404);

      const errorResponse = (await orderResponse.json()) as ApiErrorResponse;

      expect(errorResponse).toEqual({
        error: {
          code: "PRODUCT_NOT_FOUND",
          message: "Product not found",
          details: {
            missingProductIds: [testProduct.id],
          },
        },
      });
    });

    test("quantity above stock: returns INSUFFICIENT_STOCK and keeps stock unchanged", async ({
      request,
    }) => {
      const availableStock = 3;
      const requestedQuantity = 4;

      const adminToken = await loginViaApi(request, ADMIN_USER);

      const testProduct = await createProductViaApi(request, adminToken, {
        title: "Insufficient Stock Order Product",
        stock: availableStock,
      });

      const orderInput = createOrderInput([
        createOrderItemInput(testProduct.id, requestedQuantity),
      ]);

      const orderResponse = await request.post("/orders", {
        headers: {
          Authorization: `Bearer ${regularUserAuth.token}`,
        },
        data: orderInput,
      });

      expect(orderResponse.status()).toBe(409);

      const errorResponse = (await orderResponse.json()) as ApiErrorResponse;

      expect(errorResponse).toEqual({
        error: {
          code: "INSUFFICIENT_STOCK",
          message: "Insufficient stock",
          details: {
            productId: testProduct.id,
            requestedQuantity,
            availableStock,
          },
        },
      });

      const productResponse = await request.get(`/products/${testProduct.id}`, {
        headers: {
          Authorization: `Bearer ${regularUserAuth.token}`,
        },
      });

      expect(productResponse.status()).toBe(200);

      const unchangedProduct = productSchema.parse(await productResponse.json());

      expect(unchangedProduct.stock).toBe(availableStock);
    });

    test("maximum quantity: orders the entire stock and reduces it to zero", async ({
      request,
    }) => {
      const maximumPrice = 999_999;
      const maximumQuantity = 100_000;

      const adminToken = await loginViaApi(request, ADMIN_USER);

      const testProduct = await createProductViaApi(request, adminToken, {
        title: "Maximum Quantity Order Product",
        price: maximumPrice,
        stock: maximumQuantity,
      });

      const orderInput = createOrderInput([createOrderItemInput(testProduct.id, maximumQuantity)]);

      const orderResponse = await request.post("/orders", {
        headers: {
          Authorization: `Bearer ${regularUserAuth.token}`,
        },
        data: orderInput,
      });

      expect(orderResponse.status()).toBe(201);

      const createdOrder = orderSchema.parse(await orderResponse.json());

      // Maximum price 999,999 * maximum quantity 100,000 = 99,999,900,000.
      // This total requires the expanded NUMERIC(15,2) database column.
      expect(createdOrder.totalPrice).toBe(99_999_900_000);

      expect(createdOrder.items).toEqual([
        {
          productId: testProduct.id,
          title: testProduct.title,
          price: maximumPrice,
          quantity: maximumQuantity,
        },
      ]);

      const productResponse = await request.get(`/products/${testProduct.id}`, {
        headers: {
          Authorization: `Bearer ${regularUserAuth.token}`,
        },
      });

      expect(productResponse.status()).toBe(200);

      const updatedProduct = productSchema.parse(await productResponse.json());

      // 100,000 in stock - 100,000 ordered = 0 remaining.
      expect(updatedProduct.stock).toBe(0);
    });

    for (const invalidFullNameCase of invalidFullNameCases) {
      test(`fullName ${invalidFullNameCase.name}: returns VALIDATION_ERROR for fullName`, async ({
        request,
      }) => {
        // A random valid UUID is enough because body validation runs before product lookup.
        const productId = randomUUID();

        const orderInput = createOrderInput([createOrderItemInput(productId, 1)], {
          fullName: invalidFullNameCase.value,
        });

        const response = await request.post("/orders", {
          headers: {
            Authorization: `Bearer ${regularUserAuth.token}`,
          },
          data: orderInput,
        });

        await expectSingleValidationError(response, ["fullName"]);
      });
    }

    for (const invalidPhoneCase of invalidPhoneCases) {
      test(`phone ${invalidPhoneCase.name}: returns VALIDATION_ERROR for phone`, async ({
        request,
      }) => {
        // A random valid UUID is enough because body validation runs before product lookup.
        const productId = randomUUID();

        const orderInput = createOrderInput([createOrderItemInput(productId, 1)], {
          phone: invalidPhoneCase.value,
        });

        const response = await request.post("/orders", {
          headers: {
            Authorization: `Bearer ${regularUserAuth.token}`,
          },
          data: orderInput,
        });

        await expectSingleValidationError(response, ["phone"]);
      });
    }

    for (const invalidAddressCase of invalidAddressCases) {
      test(`address ${invalidAddressCase.name}: returns VALIDATION_ERROR for address`, async ({
        request,
      }) => {
        // A random valid UUID is enough because body validation runs before product lookup.
        const productId = randomUUID();

        const orderInput = createOrderInput([createOrderItemInput(productId, 1)], {
          address: invalidAddressCase.value,
        });

        const response = await request.post("/orders", {
          headers: {
            Authorization: `Bearer ${regularUserAuth.token}`,
          },
          data: orderInput,
        });

        await expectSingleValidationError(response, ["address"]);
      });
    }

    for (const invalidOrderEnumCase of invalidOrderEnumCases) {
      test(`${invalidOrderEnumCase.field} with unsupported value: returns VALIDATION_ERROR`, async ({
        request,
      }) => {
        // A random valid UUID is enough because body validation runs before product lookup.
        const productId = randomUUID();

        const orderInput = {
          ...createOrderInput([createOrderItemInput(productId, 1)]),
          [invalidOrderEnumCase.field]: invalidOrderEnumCase.value,
        };

        const response = await request.post("/orders", {
          headers: {
            Authorization: `Bearer ${regularUserAuth.token}`,
          },
          data: orderInput,
        });

        await expectSingleValidationError(response, [invalidOrderEnumCase.field]);
      });
    }

    for (const invalidQuantityCase of invalidOrderItemQuantityCases) {
      test(`item quantity ${invalidQuantityCase.name}: returns VALIDATION_ERROR for quantity`, async ({
        request,
      }) => {
        // A random valid UUID is enough because body validation runs before product lookup.
        const productId = randomUUID();

        const orderInput = createOrderInput([
          createOrderItemInput(productId, invalidQuantityCase.value),
        ]);

        const response = await request.post("/orders", {
          headers: {
            Authorization: `Bearer ${regularUserAuth.token}`,
          },
          data: orderInput,
        });

        await expectSingleValidationError(response, ["items", 0, "quantity"]);
      });
    }

    test("item productId with invalid UUID: returns VALIDATION_ERROR for productId", async ({
      request,
    }) => {
      const orderInput = createOrderInput([createOrderItemInput("not-a-uuid", 1)]);

      const response = await request.post("/orders", {
        headers: {
          Authorization: `Bearer ${regularUserAuth.token}`,
        },
        data: orderInput,
      });

      await expectSingleValidationError(response, ["items", 0, "productId"]);
    });

    test("empty items: returns VALIDATION_ERROR for items", async ({ request }) => {
      const orderInput = createOrderInput([]);

      const response = await request.post("/orders", {
        headers: {
          Authorization: `Bearer ${regularUserAuth.token}`,
        },
        data: orderInput,
      });

      await expectSingleValidationError(response, ["items"]);
    });

    test("more than 100 items: returns VALIDATION_ERROR for items", async ({ request }) => {
      // Real products are not needed because array length validation runs before product lookup.
      const orderItems = Array.from({ length: 101 }, () => createOrderItemInput(randomUUID(), 1));

      const orderInput = createOrderInput(orderItems);

      const response = await request.post("/orders", {
        headers: {
          Authorization: `Bearer ${regularUserAuth.token}`,
        },
        data: orderInput,
      });

      await expectSingleValidationError(response, ["items"]);
    });

    for (const duplicateOrderItemsCase of duplicateOrderItemsCases) {
      test(`items ${duplicateOrderItemsCase.name}: returns VALIDATION_ERROR for items`, async ({
        request,
      }) => {
        // Real products are not needed because duplicate validation runs before product lookup.
        const orderInput = createOrderInput(duplicateOrderItemsCase.value);

        const response = await request.post("/orders", {
          headers: {
            Authorization: `Bearer ${regularUserAuth.token}`,
          },
          data: orderInput,
        });

        await expectSingleValidationError(response, ["items"]);
      });
    }

    for (const validBoundaryCase of validOrderTextBoundaryCases) {
      test(`${validBoundaryCase.name}: creates order`, async ({ request }) => {
        const adminToken = await loginViaApi(request, ADMIN_USER);

        const testProduct = await createProductViaApi(request, adminToken, {
          title: `${validBoundaryCase.field} Boundary Product`,
        });

        const orderInput = {
          ...createOrderInput([createOrderItemInput(testProduct.id, 1)]),
          [validBoundaryCase.field]: validBoundaryCase.value,
        };

        const response = await request.post("/orders", {
          headers: {
            Authorization: `Bearer ${regularUserAuth.token}`,
          },
          data: orderInput,
        });

        expect(response.status()).toBe(201);

        const createdOrder = orderSchema.parse(await response.json());

        expect(createdOrder).toMatchObject({
          [validBoundaryCase.field]: validBoundaryCase.value,
        });
      });
    }

    test("100 items: creates order at maximum item count", async ({ request }) => {
      const maximumItemCount = 100;

      const adminToken = await loginViaApi(request, ADMIN_USER);

      const testProducts = await Promise.all(
        Array.from({ length: maximumItemCount }, (_, index) =>
          createProductViaApi(request, adminToken, {
            title: `Maximum Items Order Product ${index + 1}`,
            price: 1,
            stock: 1,
          }),
        ),
      );

      const orderInput = createOrderInput(
        testProducts.map((product) => createOrderItemInput(product.id, 1)),
      );

      const response = await request.post("/orders", {
        headers: {
          Authorization: `Bearer ${regularUserAuth.token}`,
        },
        data: orderInput,
      });

      expect(response.status()).toBe(201);

      const createdOrder = orderSchema.parse(await response.json());

      expect(createdOrder.items).toHaveLength(maximumItemCount);

      expect(createdOrder.items.map((item) => item.productId)).toEqual(
        testProducts.map((product) => product.id),
      );

      // 100 products * price 1 * quantity 1 = 100.
      expect(createdOrder.totalPrice).toBe(100);
    });

    test("missing fullName: returns VALIDATION_ERROR for fullName", async ({ request }) => {
      // A random valid UUID is enough because body validation runs before product lookup.
      const productId = randomUUID();

      const orderInput: Partial<CreateOrderInput> = {
        ...createOrderInput([createOrderItemInput(productId, 1)]),
      };

      delete orderInput.fullName;

      const response = await request.post("/orders", {
        headers: {
          Authorization: `Bearer ${regularUserAuth.token}`,
        },
        data: orderInput,
      });

      await expectSingleValidationError(response, ["fullName"]);
    });

    test("items with wrong type: returns VALIDATION_ERROR for items", async ({ request }) => {
      const orderInput = {
        ...createOrderInput([createOrderItemInput(randomUUID(), 1)]),
        items: "not-an-array",
      };

      const response = await request.post("/orders", {
        headers: {
          Authorization: `Bearer ${regularUserAuth.token}`,
        },
        data: orderInput,
      });

      await expectSingleValidationError(response, ["items"]);
    });

    test("insufficient stock in second item: rejects the whole order without partial changes", async ({
      request,
    }) => {
      const firstProductInitialStock = 10;
      const secondProductInitialStock = 1;

      const firstProductQuantity = 1;
      const secondProductQuantity = 5;

      const adminToken = await loginViaApi(request, ADMIN_USER);

      const firstProduct = await createProductViaApi(request, adminToken, {
        title: "Atomic Order First Product",
        stock: firstProductInitialStock,
      });

      const secondProduct = await createProductViaApi(request, adminToken, {
        title: "Atomic Order Second Product",
        stock: secondProductInitialStock,
      });

      // The valid item comes first and the insufficient item comes second.
      const orderInput = createOrderInput([
        createOrderItemInput(firstProduct.id, firstProductQuantity),
        createOrderItemInput(secondProduct.id, secondProductQuantity),
      ]);

      const regularUserHeaders = {
        Authorization: `Bearer ${regularUserAuth.token}`,
      };

      const orderResponse = await request.post("/orders", {
        headers: regularUserHeaders,
        data: orderInput,
      });

      expect(orderResponse.status()).toBe(409);

      const errorResponse = (await orderResponse.json()) as ApiErrorResponse;

      expect(errorResponse).toEqual({
        error: {
          code: "INSUFFICIENT_STOCK",
          message: "Insufficient stock",
          details: {
            productId: secondProduct.id,
            requestedQuantity: secondProductQuantity,
            availableStock: secondProductInitialStock,
          },
        },
      });

      const firstProductResponse = await request.get(`/products/${firstProduct.id}`, {
        headers: regularUserHeaders,
      });

      expect(firstProductResponse.status()).toBe(200);

      const unchangedFirstProduct = productSchema.parse(await firstProductResponse.json());

      expect(unchangedFirstProduct.stock).toBe(firstProductInitialStock);

      const secondProductResponse = await request.get(`/products/${secondProduct.id}`, {
        headers: regularUserHeaders,
      });

      expect(secondProductResponse.status()).toBe(200);

      const unchangedSecondProduct = productSchema.parse(await secondProductResponse.json());

      expect(unchangedSecondProduct.stock).toBe(secondProductInitialStock);

      const ordersResponse = await request.get("/orders", {
        headers: regularUserHeaders,
      });

      expect(ordersResponse.status()).toBe(200);

      const userOrders = orderListSchema.parse(await ordersResponse.json());

      // This user was created in beforeEach and has no earlier orders.
      expect(userOrders).toEqual([]);
    });

    test("concurrent orders for last item: creates one order without overselling", async ({
      request,
    }) => {
      const initialStock = 1;
      const orderedQuantity = 1;

      const adminToken = await loginViaApi(request, ADMIN_USER);

      const testProduct = await createProductViaApi(request, adminToken, {
        title: "Concurrent Order Product",
        stock: initialStock,
      });

      const orderInput = createOrderInput([createOrderItemInput(testProduct.id, orderedQuantity)]);

      const regularUserHeaders = {
        Authorization: `Bearer ${regularUserAuth.token}`,
      };

      // Start both requests before waiting for either one to finish.
      const [firstOrderResponse, secondOrderResponse] = await Promise.all([
        request.post("/orders", {
          headers: regularUserHeaders,
          data: orderInput,
        }),
        request.post("/orders", {
          headers: regularUserHeaders,
          data: orderInput,
        }),
      ]);

      // Either request may finish first, so compare the sorted statuses.
      const responseStatuses = [firstOrderResponse.status(), secondOrderResponse.status()].sort(
        (first, second) => first - second,
      );

      expect(responseStatuses).toEqual([201, 409]);

      const productResponse = await request.get(`/products/${testProduct.id}`, {
        headers: regularUserHeaders,
      });

      expect(productResponse.status()).toBe(200);

      const updatedProduct = productSchema.parse(await productResponse.json());

      // 1 in stock - 1 successful order = 0 remaining.
      expect(updatedProduct.stock).toBe(0);

      const ordersResponse = await request.get("/orders", {
        headers: regularUserHeaders,
      });

      expect(ordersResponse.status()).toBe(200);

      const userOrders = orderListSchema.parse(await ordersResponse.json());

      // This user is new, so only the successful concurrent request can create an order.
      expect(userOrders).toHaveLength(1);
    });
  });

  test.describe("without authentication", () => {
    test("invalid body: returns AUTHENTICATION_REQUIRED before validation", async ({ request }) => {
      const response = await request.post("/orders", {
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
