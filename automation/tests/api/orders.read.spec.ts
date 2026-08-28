import assert from "node:assert/strict";

import { expect, test } from "@playwright/test";

import {
  createProductViaApi,
  expectSingleValidationError,
  loginViaApi,
  registerUserViaApi,
} from "../../src/helpers";
import { orderListSchema, orderSchema } from "../../src/schemas";
import { ADMIN_USER, createOrderInput, createOrderItemInput } from "../../src/test-data";
import type { ApiErrorResponse, AuthResponse } from "../../src/types";

const NONEXISTENT_ORDER_ID = "00000000-0000-4000-8000-000000000000";

const INVALID_ORDER_ID = "not-a-uuid";

test.describe("GET /orders", () => {
  test.describe("authenticated user", () => {
    let regularUserAuth: AuthResponse;

    test.beforeEach(async ({ request }) => {
      regularUserAuth = await registerUserViaApi(request);
    });

    test("own orders: returns created orders with complete items", async ({ request }) => {
      const adminToken = await loginViaApi(request, ADMIN_USER);

      const firstProduct = await createProductViaApi(request, adminToken, {
        title: "Orders List First Product",
        price: 10,
        stock: 10,
      });

      const secondProduct = await createProductViaApi(request, adminToken, {
        title: "Orders List Second Product",
        price: 20,
        stock: 10,
      });

      const userHeaders = {
        Authorization: `Bearer ${regularUserAuth.token}`,
      };

      const firstOrderInput = createOrderInput([createOrderItemInput(firstProduct.id, 1)]);

      const firstOrderResponse = await request.post("/orders", {
        headers: userHeaders,
        data: firstOrderInput,
      });

      expect(firstOrderResponse.status()).toBe(201);

      const firstCreatedOrder = orderSchema.parse(await firstOrderResponse.json());

      // The second order has two items so the list response must also return
      // complete items in the same saved order.
      const secondOrderInput = createOrderInput([
        createOrderItemInput(secondProduct.id, 2),
        createOrderItemInput(firstProduct.id, 3),
      ]);

      const secondOrderResponse = await request.post("/orders", {
        headers: userHeaders,
        data: secondOrderInput,
      });

      expect(secondOrderResponse.status()).toBe(201);

      const secondCreatedOrder = orderSchema.parse(await secondOrderResponse.json());

      const response = await request.get("/orders", {
        headers: userHeaders,
      });

      expect(response.status()).toBe(200);

      const userOrders = orderListSchema.parse(await response.json());

      expect(userOrders).toHaveLength(2);

      expect(userOrders).toEqual(expect.arrayContaining([firstCreatedOrder, secondCreatedOrder]));

      const listedSecondOrder = userOrders.find((order) => order.id === secondCreatedOrder.id);

      assert(
        listedSecondOrder !== undefined,
        "Expected the order list to contain the second created order",
      );

      expect(
        listedSecondOrder.items.map(({ productId, quantity }) => ({
          productId,
          quantity,
        })),
      ).toEqual(secondOrderInput.items);
    });

    test("newest first: returns the last created order at the top", async ({ request }) => {
      const adminToken = await loginViaApi(request, ADMIN_USER);

      const testProduct = await createProductViaApi(request, adminToken, {
        title: "Order List Sorting Product",
        stock: 10,
      });

      const userHeaders = {
        Authorization: `Bearer ${regularUserAuth.token}`,
      };

      const orderInput = createOrderInput([createOrderItemInput(testProduct.id, 1)]);

      const firstOrderResponse = await request.post("/orders", {
        headers: userHeaders,
        data: orderInput,
      });

      expect(firstOrderResponse.status()).toBe(201);

      const firstCreatedOrder = orderSchema.parse(await firstOrderResponse.json());

      const secondOrderResponse = await request.post("/orders", {
        headers: userHeaders,
        data: orderInput,
      });

      expect(secondOrderResponse.status()).toBe(201);

      const secondCreatedOrder = orderSchema.parse(await secondOrderResponse.json());

      const response = await request.get("/orders", {
        headers: userHeaders,
      });

      expect(response.status()).toBe(200);

      const userOrders = orderListSchema.parse(await response.json());

      expect(userOrders.map((order) => order.id)).toEqual([
        secondCreatedOrder.id,
        firstCreatedOrder.id,
      ]);
    });

    test("another user's order: is not returned in the user's order list", async ({ request }) => {
      const orderOwnerAuth = await registerUserViaApi(request);
      const adminToken = await loginViaApi(request, ADMIN_USER);

      const testProduct = await createProductViaApi(request, adminToken, {
        title: "Private Order List Product",
        stock: 10,
      });

      const orderInput = createOrderInput([createOrderItemInput(testProduct.id, 1)]);

      const orderResponse = await request.post("/orders", {
        headers: {
          Authorization: `Bearer ${orderOwnerAuth.token}`,
        },
        data: orderInput,
      });

      expect(orderResponse.status()).toBe(201);

      const createdOrder = orderSchema.parse(await orderResponse.json());

      const ownerOrdersResponse = await request.get("/orders", {
        headers: {
          Authorization: `Bearer ${orderOwnerAuth.token}`,
        },
      });

      expect(ownerOrdersResponse.status()).toBe(200);

      const ownerOrders = orderListSchema.parse(await ownerOrdersResponse.json());

      // The owner's response proves that the order exists and GET /orders returns it.
      expect(ownerOrders).toEqual([createdOrder]);

      const anotherUserOrdersResponse = await request.get("/orders", {
        headers: {
          Authorization: `Bearer ${regularUserAuth.token}`,
        },
      });

      expect(anotherUserOrdersResponse.status()).toBe(200);

      const anotherUserOrders = orderListSchema.parse(await anotherUserOrdersResponse.json());

      // The user from beforeEach has no own orders and cannot see the owner's order.
      expect(anotherUserOrders).toEqual([]);
    });

    test("no orders: returns an empty list", async ({ request }) => {
      const response = await request.get("/orders", {
        headers: {
          Authorization: `Bearer ${regularUserAuth.token}`,
        },
      });

      expect(response.status()).toBe(200);

      const userOrders = orderListSchema.parse(await response.json());

      expect(userOrders).toEqual([]);
    });
  });

  test.describe("without authentication", () => {
    test("returns AUTHENTICATION_REQUIRED", async ({ request }) => {
      const response = await request.get("/orders");

      expect(response.status()).toBe(401);

      const errorResponse = (await response.json()) as ApiErrorResponse;

      expect(errorResponse).toEqual({
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "Authentication is required",
        },
      });
    });
  });
});

test.describe("GET /orders/:id", () => {
  test.describe("authenticated user", () => {
    let regularUserAuth: AuthResponse;

    test.beforeEach(async ({ request }) => {
      regularUserAuth = await registerUserViaApi(request);
    });

    test("own order: returns the complete order by id", async ({ request }) => {
      const adminToken = await loginViaApi(request, ADMIN_USER);

      const firstProduct = await createProductViaApi(request, adminToken, {
        title: "Order By Id First Product",
        price: 10,
        stock: 10,
      });

      const secondProduct = await createProductViaApi(request, adminToken, {
        title: "Order By Id Second Product",
        price: 20,
        stock: 10,
      });

      const userHeaders = {
        Authorization: `Bearer ${regularUserAuth.token}`,
      };

      const orderInput = createOrderInput([
        createOrderItemInput(secondProduct.id, 2),
        createOrderItemInput(firstProduct.id, 3),
      ]);

      const orderResponse = await request.post("/orders", {
        headers: userHeaders,
        data: orderInput,
      });

      expect(orderResponse.status()).toBe(201);

      const createdOrder = orderSchema.parse(await orderResponse.json());

      const listResponse = await request.get("/orders", {
        headers: userHeaders,
      });

      expect(listResponse.status()).toBe(200);

      const userOrders = orderListSchema.parse(await listResponse.json());

      expect(userOrders).toEqual([createdOrder]);

      const response = await request.get(`/orders/${createdOrder.id}`, {
        headers: userHeaders,
      });

      expect(response.status()).toBe(200);

      const returnedOrder = orderSchema.parse(await response.json());

      expect(returnedOrder).toEqual(userOrders[0]);

      expect(
        returnedOrder.items.map(({ productId, quantity }) => ({
          productId,
          quantity,
        })),
      ).toEqual(orderInput.items);
    });

    test("another user's order: returns ORDER_NOT_FOUND", async ({ request }) => {
      const orderOwnerAuth = await registerUserViaApi(request);
      const adminToken = await loginViaApi(request, ADMIN_USER);

      const testProduct = await createProductViaApi(request, adminToken, {
        title: "Private Order By Id Product",
        stock: 10,
      });

      const orderInput = createOrderInput([createOrderItemInput(testProduct.id, 1)]);

      const orderResponse = await request.post("/orders", {
        headers: {
          Authorization: `Bearer ${orderOwnerAuth.token}`,
        },
        data: orderInput,
      });

      expect(orderResponse.status()).toBe(201);

      const createdOrder = orderSchema.parse(await orderResponse.json());

      const ownerResponse = await request.get(`/orders/${createdOrder.id}`, {
        headers: {
          Authorization: `Bearer ${orderOwnerAuth.token}`,
        },
      });

      expect(ownerResponse.status()).toBe(200);

      const ownerOrder = orderSchema.parse(await ownerResponse.json());

      // This proves that the order exists and its owner can access it.
      expect(ownerOrder).toEqual(createdOrder);

      const anotherUserResponse = await request.get(`/orders/${createdOrder.id}`, {
        headers: {
          Authorization: `Bearer ${regularUserAuth.token}`,
        },
      });

      expect(anotherUserResponse.status()).toBe(404);

      const errorResponse = (await anotherUserResponse.json()) as ApiErrorResponse;

      expect(errorResponse).toEqual({
        error: {
          code: "ORDER_NOT_FOUND",
          message: "Order not found",
        },
      });
    });

    test("nonexistent order: returns ORDER_NOT_FOUND", async ({ request }) => {
      const response = await request.get(`/orders/${NONEXISTENT_ORDER_ID}`, {
        headers: {
          Authorization: `Bearer ${regularUserAuth.token}`,
        },
      });

      expect(response.status()).toBe(404);

      const errorResponse = (await response.json()) as ApiErrorResponse;

      expect(errorResponse).toEqual({
        error: {
          code: "ORDER_NOT_FOUND",
          message: "Order not found",
        },
      });
    });

    test("invalid order id: returns VALIDATION_ERROR for id", async ({ request }) => {
      const response = await request.get(`/orders/${INVALID_ORDER_ID}`, {
        headers: {
          Authorization: `Bearer ${regularUserAuth.token}`,
        },
      });

      await expectSingleValidationError(response, ["id"]);
    });

    test("deleted product: remains in the order with its saved title and price", async ({
      request,
    }) => {
      const adminToken = await loginViaApi(request, ADMIN_USER);

      const testProduct = await createProductViaApi(request, adminToken, {
        title: "Deleted Product Order History",
        price: 49.99,
        stock: 10,
      });

      const orderedQuantity = 2;

      const userHeaders = {
        Authorization: `Bearer ${regularUserAuth.token}`,
      };

      const orderInput = createOrderInput([createOrderItemInput(testProduct.id, orderedQuantity)]);

      const orderResponse = await request.post("/orders", {
        headers: userHeaders,
        data: orderInput,
      });

      expect(orderResponse.status()).toBe(201);

      const createdOrder = orderSchema.parse(await orderResponse.json());

      const deleteResponse = await request.delete(`/products/${testProduct.id}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(deleteResponse.status()).toBe(204);

      const productResponse = await request.get(`/products/${testProduct.id}`, {
        headers: userHeaders,
      });

      // This proves that the product is no longer available through the Products API.
      expect(productResponse.status()).toBe(404);

      const response = await request.get(`/orders/${createdOrder.id}`, {
        headers: userHeaders,
      });

      expect(response.status()).toBe(200);

      const returnedOrder = orderSchema.parse(await response.json());

      expect(returnedOrder.id).toBe(createdOrder.id);

      expect(returnedOrder.items).toEqual([
        {
          productId: testProduct.id,
          title: testProduct.title,
          price: testProduct.price,
          quantity: orderedQuantity,
        },
      ]);
    });
  });

  test.describe("without authentication", () => {
    test("invalid order id: returns AUTHENTICATION_REQUIRED before validation", async ({
      request,
    }) => {
      const response = await request.get(`/orders/${INVALID_ORDER_ID}`);

      expect(response.status()).toBe(401);

      const errorResponse = (await response.json()) as ApiErrorResponse;

      expect(errorResponse).toEqual({
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "Authentication is required",
        },
      });
    });
  });
});

test.describe("Orders API access", () => {
  test.describe("admin", () => {
    test("creates, lists, and retrieves an order", async ({ request }) => {
      const adminToken = await loginViaApi(request, ADMIN_USER);

      const testProduct = await createProductViaApi(request, adminToken, {
        title: "Admin Order Product",
        price: 25,
        stock: 10,
      });

      const adminHeaders = {
        Authorization: `Bearer ${adminToken}`,
      };

      const orderInput = createOrderInput([createOrderItemInput(testProduct.id, 2)]);

      const createResponse = await request.post("/orders", {
        headers: adminHeaders,
        data: orderInput,
      });

      expect(createResponse.status()).toBe(201);

      const createdOrder = orderSchema.parse(await createResponse.json());

      const listResponse = await request.get("/orders", {
        headers: adminHeaders,
      });

      expect(listResponse.status()).toBe(200);

      const adminOrders = orderListSchema.parse(await listResponse.json());

      expect(adminOrders).toEqual(expect.arrayContaining([createdOrder]));

      const orderByIdResponse = await request.get(`/orders/${createdOrder.id}`, {
        headers: adminHeaders,
      });

      expect(orderByIdResponse.status()).toBe(200);

      const orderById = orderSchema.parse(await orderByIdResponse.json());

      expect(orderById).toEqual(createdOrder);
    });
  });
});
