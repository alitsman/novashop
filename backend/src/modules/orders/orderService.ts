import type { PoolClient } from "pg";

import { pool } from "../../db/index.js";
import { AppError } from "../../errors/index.js";

import { mapOrderRowToOrder, mapOrderRowsToOrders } from "./orderMapper.js";
import type {
  CreateOrderInput,
  CreateOrderItemInput,
  Order,
  OrderDbRow,
  OrderItemDbRow,
} from "./orderTypes.js";

type ProductForOrderDbRow = {
  id: string;
  title: string;
  price: string;
  stock: number;
};

type PreparedOrderItem = {
  productId: string;
  title: string;
  price: string;
  priceInCents: number;
  quantity: number;
};

const prepareOrderItems = (
  productRows: ProductForOrderDbRow[],
  inputItems: CreateOrderItemInput[],
): PreparedOrderItem[] => {
  const foundProductIds = new Set(productRows.map((productRow) => productRow.id));

  const missingProductIds = inputItems
    .map((inputItem) => inputItem.productId)
    .filter((productId) => !foundProductIds.has(productId));

  if (missingProductIds.length > 0) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND", {
      missingProductIds,
    });
  }

  const inputItemsByProductId = new Map(inputItems.map((item) => [item.productId, item]));

  return productRows.map((productRow) => {
    const inputItem = inputItemsByProductId.get(productRow.id);

    if (inputItem === undefined) {
      throw new Error("A locked product does not have a matching order item.");
    }

    if (inputItem.quantity > productRow.stock) {
      throw new AppError("Insufficient stock", 409, "INSUFFICIENT_STOCK", {
        productId: productRow.id,
        requestedQuantity: inputItem.quantity,
        availableStock: productRow.stock,
      });
    }

    return {
      productId: productRow.id,
      title: productRow.title,
      price: productRow.price,
      priceInCents: Math.round(Number(productRow.price) * 100),
      quantity: inputItem.quantity,
    };
  });
};

const insertOrderItems = async (
  client: PoolClient,
  orderId: string,
  items: PreparedOrderItem[],
): Promise<OrderItemDbRow[]> => {
  const values: Array<string | number> = [];

  const valuePlaceholders = items.map((item, index) => {
    const parameterOffset = index * 5;

    values.push(orderId, item.productId, item.title, item.price, item.quantity);

    return `(
      $${parameterOffset + 1},
      $${parameterOffset + 2},
      $${parameterOffset + 3},
      $${parameterOffset + 4},
      $${parameterOffset + 5}
    )`;
  });

  const result = await client.query<OrderItemDbRow>(
    `
      INSERT INTO order_items (
        order_id,
        product_id,
        title,
        price,
        quantity
      )
      VALUES ${valuePlaceholders.join(", ")}
      RETURNING
        order_id,
        product_id,
        title,
        price,
        quantity;
    `,
    values,
  );

  if (result.rows.length !== items.length) {
    throw new Error("The database did not return all created order items.");
  }

  return result.rows;
};

const decrementProductStocks = async (
  client: PoolClient,
  items: PreparedOrderItem[],
): Promise<void> => {
  const values: Array<string | number> = [];

  const valuePlaceholders = items.map((item, index) => {
    const parameterOffset = index * 2;

    values.push(item.productId, item.quantity);

    return `(
      $${parameterOffset + 1}::uuid,
      $${parameterOffset + 2}::integer
    )`;
  });

  const result = await client.query(
    `
      UPDATE products AS product
      SET
        stock = product.stock - requested.quantity,
        updated_at = NOW()
      FROM (
        VALUES ${valuePlaceholders.join(", ")}
      ) AS requested(product_id, quantity)
      WHERE product.id = requested.product_id;
    `,
    values,
  );

  if (result.rowCount !== items.length) {
    throw new Error("The database did not update all ordered products.");
  }
};

export const createNewOrder = async (userId: string, input: CreateOrderInput): Promise<Order> => {
  const client = await pool.connect();
  let shouldDestroyClient = false;

  try {
    await client.query("BEGIN");

    const productIds = input.items.map((item) => item.productId);

    // Lock products in a stable order to prevent deadlocks between
    // concurrent multi-product orders.
    const productsResult = await client.query<ProductForOrderDbRow>(
      `
          SELECT
            id,
            title,
            price,
            stock
          FROM products
          WHERE id = ANY($1::uuid[])
            AND deleted_at IS NULL
          ORDER BY id
          FOR UPDATE;
        `,
      [productIds],
    );

    const preparedItems = prepareOrderItems(productsResult.rows, input.items);

    const totalInCents = preparedItems.reduce(
      (total, item) => total + item.priceInCents * item.quantity,
      0,
    );

    const totalPrice = totalInCents / 100;

    const orderResult = await client.query<OrderDbRow>(
      `
        INSERT INTO orders (
          user_id,
          total_price,
          full_name,
          phone,
          address,
          delivery_method,
          payment_method
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
          id,
          order_number,
          user_id,
          total_price,
          full_name,
          phone,
          address,
          delivery_method,
          payment_method,
          created_at;
      `,
      [
        userId,
        totalPrice,
        input.fullName,
        input.phone,
        input.address,
        input.deliveryMethod,
        input.paymentMethod,
      ],
    );

    const orderRow = orderResult.rows[0];

    if (orderRow === undefined) {
      throw new Error("The database did not return the created order.");
    }

    const orderItemRows = await insertOrderItems(client, orderRow.id, preparedItems);

    await decrementProductStocks(client, preparedItems);

    const order = mapOrderRowToOrder(orderRow, orderItemRows);

    await client.query("COMMIT");

    return order;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Preserve the original transaction error and remove the unusable
      // connection from the pool.
      shouldDestroyClient = true;
    }

    throw error;
  } finally {
    client.release(shouldDestroyClient);
  }
};

export const getOrdersForUser = async (userId: string): Promise<Order[]> => {
  const ordersResult = await pool.query<OrderDbRow>(
    `
      SELECT
        id,
        order_number,
        user_id,
        total_price,
        full_name,
        phone,
        address,
        delivery_method,
        payment_method,
        created_at
      FROM orders
      WHERE user_id = $1
      ORDER BY created_at DESC, id DESC;
    `,
    [userId],
  );

  if (ordersResult.rows.length === 0) {
    return [];
  }

  const orderIds = ordersResult.rows.map((order) => order.id);

  const orderItemsResult = await pool.query<OrderItemDbRow>(
    `
        SELECT
          order_id,
          product_id,
          title,
          price,
          quantity
        FROM order_items
        WHERE order_id = ANY($1::uuid[])
        ORDER BY order_id, product_id;
      `,
    [orderIds],
  );

  return mapOrderRowsToOrders(ordersResult.rows, orderItemsResult.rows);
};

export const getOrderByIdForUser = async (orderId: string, userId: string): Promise<Order> => {
  const orderResult = await pool.query<OrderDbRow>(
    `
      SELECT
        id,
        order_number,
        user_id,
        total_price,
        full_name,
        phone,
        address,
        delivery_method,
        payment_method,
        created_at
      FROM orders
      WHERE id = $1
        AND user_id = $2;
    `,
    [orderId, userId],
  );

  const orderRow = orderResult.rows[0];

  if (orderRow === undefined) {
    throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
  }

  const orderItemsResult = await pool.query<OrderItemDbRow>(
    `
        SELECT
          order_id,
          product_id,
          title,
          price,
          quantity
        FROM order_items
        WHERE order_id = $1
        ORDER BY product_id;
      `,
    [orderId],
  );

  return mapOrderRowToOrder(orderRow, orderItemsResult.rows);
};
