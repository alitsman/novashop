import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector, useAppStore } from "../../app/hooks";
import { useToast } from "../../components/common/toast";
import { selectAuthToken, selectCurrentUser } from "../../features/auth/authSlice";
import {
  clearCart,
  invalidateCartSync,
  restoreCart,
  selectCartCheckoutError,
  selectCartItems,
  selectCartOwnerUserId,
  selectCartSyncError,
  selectCartSyncStatus,
  selectCartTotalPrice,
  selectCartTotalQuantity,
  selectIsCartEmpty,
  syncCart,
} from "../../features/cart/cartSlice";
import {
  clearOrdersCreateError,
  createOrder,
  fetchMyOrders,
  OrdersRequestStatus,
  selectOrdersCreateError,
  selectOrdersCreateStatus,
} from "../../features/orders/ordersSlice";
import { invalidateProducts } from "../../features/products/productsSlice";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { cartService } from "../../services/cartService";
import { CartRequestStatus } from "../../types/cart";
import type { CreateOrderItemInput, Order } from "../../types/order";
import { DeliveryMethod, PaymentMethod, type CheckoutForm } from "../../types/checkout";
import { CheckoutPageView, type CheckoutOrderItemViewModel } from "./CheckoutPageView";
import { validateCheckoutForm, type CheckoutFormErrors } from "./checkoutValidation";

const initialCheckoutForm: CheckoutForm = {
  fullName: "",
  phone: "",
  address: "",
  deliveryMethod: DeliveryMethod.Standard,
  paymentMethod: PaymentMethod.Cash,
};

export function CheckoutPage() {
  useDocumentTitle("Checkout");

  const dispatch = useAppDispatch();
  const store = useAppStore();
  const navigate = useNavigate();
  const showToast = useToast();

  const currentUser = useAppSelector(selectCurrentUser);
  const sessionToken = useAppSelector(selectAuthToken);
  const cartOwnerUserId = useAppSelector(selectCartOwnerUserId);
  const syncStatus = useAppSelector(selectCartSyncStatus);
  const syncError = useAppSelector(selectCartSyncError);
  const cartCheckoutError = useAppSelector(selectCartCheckoutError);
  const cartItems = useAppSelector(selectCartItems);
  const totalPrice = useAppSelector(selectCartTotalPrice);
  const totalQuantity = useAppSelector(selectCartTotalQuantity);
  const isCartEmpty = useAppSelector(selectIsCartEmpty);
  const createStatus = useAppSelector(selectOrdersCreateStatus);
  const createError = useAppSelector(selectOrdersCreateError);

  const isCheckoutMountedRef = useRef(false);
  const isSubmitActiveRef = useRef(false);
  const hasInitializedCartRef = useRef(false);

  const fullNameInputRef = useRef<HTMLInputElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const addressTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [formValues, setFormValues] = useState<CheckoutForm>(initialCheckoutForm);
  const [formErrors, setFormErrors] = useState<CheckoutFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [isSubmitActive, setIsSubmitActive] = useState(false);

  const currentUserId = currentUser?.id;
  const isCheckingCart =
    syncStatus === CartRequestStatus.Idle || syncStatus === CartRequestStatus.Loading;
  const isSubmitting =
    isSubmitActive || isCheckingCart || createStatus === OrdersRequestStatus.Loading;

  useEffect(() => {
    // Set the flag again because StrictMode reruns effects in development.
    isCheckoutMountedRef.current = true;

    return () => {
      isCheckoutMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (hasInitializedCartRef.current) {
      return;
    }

    // StrictMode replays effects; reset once per page mount.
    hasInitializedCartRef.current = true;
    dispatch(clearOrdersCreateError());
    dispatch(invalidateCartSync());
  }, [dispatch]);

  useEffect(() => {
    if (
      !currentUserId ||
      !sessionToken ||
      cartOwnerUserId !== currentUserId ||
      isCartEmpty ||
      syncStatus !== CartRequestStatus.Idle
    ) {
      return;
    }

    // The first effect run may have already started this request.
    if (selectCartSyncStatus(store.getState()) !== CartRequestStatus.Idle) {
      return;
    }

    void dispatch(syncCart());
  }, [dispatch, store, currentUserId, sessionToken, cartOwnerUserId, isCartEmpty, syncStatus]);

  const focusFirstInvalidField = (validationErrors: CheckoutFormErrors) => {
    if (validationErrors.fullName) {
      fullNameInputRef.current?.focus();
      return;
    }

    if (validationErrors.phone) {
      phoneInputRef.current?.focus();
      return;
    }

    if (validationErrors.address) {
      addressTextareaRef.current?.focus();
    }
  };

  const clearSubmitState = () => {
    setSubmitError(null);
    dispatch(clearOrdersCreateError());
  };

  const clearFieldError = (fieldName: keyof CheckoutForm) => {
    setFormErrors((currentErrors) => {
      if (!currentErrors[fieldName]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName];

      return nextErrors;
    });
  };

  const handleFullNameChange = (fullName: string) => {
    setFormValues((currentValues) => {
      return {
        ...currentValues,
        fullName,
      };
    });

    clearFieldError("fullName");
    clearSubmitState();
  };

  const handlePhoneChange = (phone: string) => {
    setFormValues((currentValues) => {
      return {
        ...currentValues,
        phone,
      };
    });

    clearFieldError("phone");
    clearSubmitState();
  };

  const handleAddressChange = (address: string) => {
    setFormValues((currentValues) => {
      return {
        ...currentValues,
        address,
      };
    });

    clearFieldError("address");
    clearSubmitState();
  };

  const handleDeliveryMethodChange = (deliveryMethod: CheckoutForm["deliveryMethod"]) => {
    setFormValues((currentValues) => {
      return {
        ...currentValues,
        deliveryMethod,
      };
    });

    clearSubmitState();
  };

  const handlePaymentMethodChange = (paymentMethod: CheckoutForm["paymentMethod"]) => {
    setFormValues((currentValues) => {
      return {
        ...currentValues,
        paymentMethod,
      };
    });

    clearSubmitState();
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !isCheckoutMountedRef.current ||
      isSubmitting ||
      isSubmitActiveRef.current ||
      selectOrdersCreateStatus(store.getState()) === OrdersRequestStatus.Loading
    ) {
      return;
    }

    const validationErrors = validateCheckoutForm(formValues);
    const hasValidationErrors = Object.keys(validationErrors).length > 0;

    if (hasValidationErrors) {
      setFormErrors(validationErrors);
      setSubmitError(null);
      focusFirstInvalidField(validationErrors);
      return;
    }

    if (!currentUser || !sessionToken) {
      setFormErrors({});
      setSubmitError("You need to be logged in to place an order.");
      return;
    }

    const submittingUserId = currentUser.id;
    const submittingToken = sessionToken;
    const reviewedCartItems = cartItems;

    const isCurrentSession = () => {
      const state = store.getState();

      return (
        selectAuthToken(state) === submittingToken &&
        selectCurrentUser(state)?.id === submittingUserId &&
        selectCartOwnerUserId(state) === submittingUserId
      );
    };

    if (!isCurrentSession()) {
      return;
    }

    if (selectIsCartEmpty(store.getState())) {
      setFormErrors({});
      setSubmitError("Your cart is empty. Add products before placing an order.");
      return;
    }

    isSubmitActiveRef.current = true;
    setIsSubmitActive(true);
    setFormErrors({});
    setSubmitError(null);
    dispatch(clearOrdersCreateError());

    let syncRequestId: string | null = null;
    let orderRequestId: string | null = null;
    let orderItems: CreateOrderItemInput[];
    let createdOrder: Order;

    try {
      const syncRequest = dispatch(syncCart());
      syncRequestId = syncRequest.requestId;
      await syncRequest.unwrap();

      if (!isCurrentSession() || !isCheckoutMountedRef.current) {
        return;
      }

      const syncedState = store.getState();
      const updatedCartItems = selectCartItems(syncedState);
      const checkoutError = cartService.getCheckoutError(updatedCartItems);

      if (checkoutError) {
        setSubmitError(checkoutError);
        return;
      }

      // Stop checkout if the cart contains an item the user did not review.
      const hasPriceChanges = updatedCartItems.some((item, index) => {
        const reviewedItem = reviewedCartItems[index];

        return (
          !reviewedItem || Math.round(item.price * 100) !== Math.round(reviewedItem.price * 100)
        );
      });

      if (hasPriceChanges) {
        setSubmitError("Prices have changed. Review the updated total and place your order again.");
        return;
      }

      orderItems = updatedCartItems.map((item) => {
        return {
          productId: item.productId,
          quantity: item.quantity,
        };
      });

      const orderRequest = dispatch(
        createOrder({
          items: orderItems,
          fullName: formValues.fullName,
          phone: formValues.phone,
          address: formValues.address,
          deliveryMethod: formValues.deliveryMethod,
          paymentMethod: formValues.paymentMethod,
        }),
      );

      orderRequestId = orderRequest.requestId;
      createdOrder = await orderRequest.unwrap();
    } catch (error) {
      if (!isCurrentSession() || !isCheckoutMountedRef.current) {
        return;
      }

      const state = store.getState();

      if (orderRequestId) {
        if (state.orders.createRequestId !== orderRequestId) {
          return;
        }
      } else if (state.cart.syncRequestId !== syncRequestId) {
        return;
      }

      setSubmitError(
        typeof error === "string"
          ? error
          : "Could not confirm the order. Check My orders before trying again.",
      );
      return;
    } finally {
      isSubmitActiveRef.current = false;

      if (isCheckoutMountedRef.current) {
        setIsSubmitActive(false);
      }
    }

    if (!createdOrder || !orderRequestId || !isCurrentSession()) {
      return;
    }

    const completedState = store.getState();

    if (
      completedState.orders.createRequestId !== orderRequestId ||
      completedState.orders.createStatus !== OrdersRequestStatus.Succeeded
    ) {
      return;
    }

    // The order already exists on the server. Leaving checkout must not undo or retry it.
    const orderedQuantities = new Map(orderItems.map((item) => [item.productId, item.quantity]));

    const remainingCartItems = selectCartItems(completedState)
      .map((item) => {
        const orderedQuantity = orderedQuantities.get(item.productId) ?? 0;

        return {
          ...item,
          quantity: Math.max(0, item.quantity - orderedQuantity),
        };
      })
      .filter((item) => item.quantity > 0);

    if (remainingCartItems.length === 0) {
      dispatch(clearCart());
    } else {
      dispatch(restoreCart({ userId: submittingUserId, items: remainingCartItems }));
    }

    dispatch(invalidateProducts());
    void dispatch(fetchMyOrders());

    if (!isCheckoutMountedRef.current) {
      return;
    }

    setFormValues(initialCheckoutForm);
    showToast("Order created successfully.");
    void navigate("/orders");
  };

  const orderItems: CheckoutOrderItemViewModel[] = cartItems.map((cartItem) => {
    const itemTotalPrice = cartItem.price * cartItem.quantity;

    return {
      productId: cartItem.productId,
      title: cartItem.title,
      quantityText: cartItem.quantity === 1 ? "1 item" : `${cartItem.quantity} items`,
      priceText: `$${cartItem.price.toFixed(2)}`,
      itemTotalText: `$${itemTotalPrice.toFixed(2)}`,
    };
  });

  const totalQuantityText =
    totalQuantity === 1 ? "1 item in cart" : `${totalQuantity} items in cart`;

  const totalPriceText = `Total: $${totalPrice.toFixed(2)}`;

  let cartError: string | null = null;

  if (syncStatus === CartRequestStatus.Failed) {
    cartError = syncError;
  } else if (syncStatus === CartRequestStatus.Succeeded) {
    cartError = cartCheckoutError;
  }

  return (
    <CheckoutPageView
      isCartEmpty={isCartEmpty}
      orderItems={orderItems}
      totalQuantityText={totalQuantityText}
      totalPriceText={totalPriceText}
      formValues={formValues}
      formErrors={formErrors}
      submitError={submitError ?? createError ?? cartError}
      isSubmitting={isSubmitting}
      fullNameInputRef={fullNameInputRef}
      phoneInputRef={phoneInputRef}
      addressTextareaRef={addressTextareaRef}
      onFullNameChange={handleFullNameChange}
      onPhoneChange={handlePhoneChange}
      onAddressChange={handleAddressChange}
      onDeliveryMethodChange={handleDeliveryMethodChange}
      onPaymentMethodChange={handlePaymentMethodChange}
      onSubmit={handleSubmit}
    />
  );
}
