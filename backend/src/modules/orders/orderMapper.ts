import type { Order, OrderDbRow, OrderItem, OrderItemDbRow } from "./orderTypes.js";

export const mapOrderItemRowToOrderItem = (row: OrderItemDbRow): OrderItem => {
  return {
    productId: row.product_id,
    title: row.title,
    price: Number(row.price),
    quantity: row.quantity,
  };
};

export const mapOrderRowToOrder = (row: OrderDbRow, itemRows: OrderItemDbRow[]): Order => {
  const sortedItemRows = [...itemRows].sort((firstItem, secondItem) => {
    return firstItem.product_id.localeCompare(secondItem.product_id);
  });

  return {
    id: row.id,
    orderNumber: Number(row.order_number),
    userId: row.user_id,
    items: sortedItemRows.map(mapOrderItemRowToOrderItem),
    totalPrice: Number(row.total_price),
    fullName: row.full_name,
    phone: row.phone,
    address: row.address,
    deliveryMethod: row.delivery_method,
    paymentMethod: row.payment_method,
    createdAt: row.created_at.toISOString(),
  };
};

export const mapOrderRowsToOrders = (
  orderRows: OrderDbRow[],
  itemRows: OrderItemDbRow[],
): Order[] => {
  const itemRowsByOrderId = new Map<string, OrderItemDbRow[]>();

  for (const itemRow of itemRows) {
    const existingItemRows = itemRowsByOrderId.get(itemRow.order_id) ?? [];

    existingItemRows.push(itemRow);
    itemRowsByOrderId.set(itemRow.order_id, existingItemRows);
  }

  return orderRows.map((orderRow) => {
    const orderItemRows = itemRowsByOrderId.get(orderRow.id) ?? [];

    return mapOrderRowToOrder(orderRow, orderItemRows);
  });
};
