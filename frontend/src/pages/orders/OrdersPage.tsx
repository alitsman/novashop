import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { selectCurrentUser } from "../../features/auth/authSlice";
import {
  fetchMyOrders,
  OrdersRequestStatus,
  selectOrders,
  selectOrdersFetchError,
  selectOrdersFetchStatus,
} from "../../features/orders/ordersSlice";
import { DeliveryMethod, PaymentMethod } from "../../types/checkout";
import type { Order } from "../../types/order";
import {
  OrdersPageView,
  type OrdersPageOrderViewModel,
} from "./OrdersPageView";

const orderDateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const formatPrice = (price: number) => {
  return `$${price.toFixed(2)}`;
};

const formatOrderDate = (createdAt: string) => {
  return orderDateFormatter.format(new Date(createdAt));
};

const getDeliveryMethodText = (deliveryMethod: DeliveryMethod) => {
  if (deliveryMethod === DeliveryMethod.Express) {
    return "Express delivery";
  }

  return "Standard delivery";
};

const getPaymentMethodText = (paymentMethod: PaymentMethod) => {
  if (paymentMethod === PaymentMethod.Card) {
    return "Card";
  }

  return "Cash";
};

const getOrderItemsCount = (order: Order) => {
  return order.items.reduce((totalQuantity, item) => {
    return totalQuantity + item.quantity;
  }, 0);
};

const mapOrderToViewModel = (order: Order): OrdersPageOrderViewModel => {
  const itemsCount = getOrderItemsCount(order);

  return {
    id: order.id,
    title: `Order #${order.orderNumber}`,
    createdAtText: formatOrderDate(order.createdAt),
    customerName: order.fullName,
    address: order.address,
    deliveryMethodText: getDeliveryMethodText(order.deliveryMethod),
    paymentMethodText: getPaymentMethodText(order.paymentMethod),
    totalPriceText: formatPrice(order.totalPrice),
    itemsCountText: itemsCount === 1 ? "1 item" : `${itemsCount} items`,
    items: order.items.map((item) => {
      const itemTotalPrice = item.price * item.quantity;

      return {
        productId: item.productId,
        title: item.title,
        quantityText: item.quantity === 1 ? "1 item" : `${item.quantity} items`,
        priceText: formatPrice(item.price),
        itemTotalText: formatPrice(itemTotalPrice),
      };
    }),
  };
};

export function OrdersPage() {
  const dispatch = useAppDispatch();

  const currentUser = useAppSelector(selectCurrentUser);
  const orders = useAppSelector(selectOrders);
  const fetchStatus = useAppSelector(selectOrdersFetchStatus);
  const fetchError = useAppSelector(selectOrdersFetchError);

  const currentUserId = currentUser?.id;

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    void dispatch(fetchMyOrders(currentUserId));
  }, [dispatch, currentUserId]);

  const orderViewModels = orders.map(mapOrderToViewModel);
  const isLoading = fetchStatus === OrdersRequestStatus.Loading;

  const errorMessage = !currentUser
    ? "You need to be logged in to view your orders."
    : fetchStatus === OrdersRequestStatus.Failed
      ? fetchError
      : null;

  return (
    <OrdersPageView
      orders={orderViewModels}
      isLoading={isLoading}
      errorMessage={errorMessage}
    />
  );
}
