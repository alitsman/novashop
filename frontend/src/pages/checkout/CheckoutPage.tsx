import { useRef, useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { useToast } from "../../components/common/toast";
import { selectCurrentUser } from "../../features/auth/authSlice";
import {
  clearCart,
  selectCartItems,
  selectCartTotalPrice,
  selectCartTotalQuantity,
  selectIsCartEmpty,
} from "../../features/cart/cartSlice";
import {
  clearOrdersCreateError,
  createOrder,
  OrdersRequestStatus,
  selectOrdersCreateError,
  selectOrdersCreateStatus,
} from "../../features/orders/ordersSlice";
import {
  DeliveryMethod,
  PaymentMethod,
  type CheckoutForm,
} from "../../types/checkout";
import {
  CheckoutPageView,
  type CheckoutOrderItemViewModel,
} from "./CheckoutPageView";
import {
  validateCheckoutForm,
  type CheckoutFormErrors,
} from "./checkoutValidation";

const initialCheckoutForm: CheckoutForm = {
  fullName: "",
  phone: "",
  address: "",
  deliveryMethod: DeliveryMethod.Standard,
  paymentMethod: PaymentMethod.Cash,
};

export function CheckoutPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const showToast = useToast();

  const currentUser = useAppSelector(selectCurrentUser);
  const cartItems = useAppSelector(selectCartItems);
  const totalPrice = useAppSelector(selectCartTotalPrice);
  const totalQuantity = useAppSelector(selectCartTotalQuantity);
  const isCartEmpty = useAppSelector(selectIsCartEmpty);
  const createStatus = useAppSelector(selectOrdersCreateStatus);
  const createError = useAppSelector(selectOrdersCreateError);

  const fullNameInputRef = useRef<HTMLInputElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const addressTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [formValues, setFormValues] =
    useState<CheckoutForm>(initialCheckoutForm);
  const [formErrors, setFormErrors] = useState<CheckoutFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isSubmitting = createStatus === OrdersRequestStatus.Loading;

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

  const handleDeliveryMethodChange = (
    deliveryMethod: CheckoutForm["deliveryMethod"],
  ) => {
    setFormValues((currentValues) => {
      return {
        ...currentValues,
        deliveryMethod,
      };
    });

    clearSubmitState();
  };

  const handlePaymentMethodChange = (
    paymentMethod: CheckoutForm["paymentMethod"],
  ) => {
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

    if (isSubmitting) {
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

    if (!currentUser) {
      setFormErrors({});
      setSubmitError("You need to be logged in to place an order.");
      return;
    }

    if (isCartEmpty) {
      setFormErrors({});
      setSubmitError(
        "Your cart is empty. Add products before placing an order.",
      );
      return;
    }

    setFormErrors({});
    setSubmitError(null);
    dispatch(clearOrdersCreateError());

    const orderItems = cartItems.map((cartItem) => {
      return {
        productId: cartItem.productId,
        title: cartItem.title,
        price: cartItem.price,
        quantity: cartItem.quantity,
      };
    });

    try {
      await dispatch(
        createOrder({
          userId: currentUser.id,
          items: orderItems,
          totalPrice,
          fullName: formValues.fullName,
          phone: formValues.phone,
          address: formValues.address,
          deliveryMethod: formValues.deliveryMethod,
          paymentMethod: formValues.paymentMethod,
        }),
      ).unwrap();

      dispatch(clearCart());
      setFormValues(initialCheckoutForm);
      showToast("Order created successfully.");
      navigate("/orders");
    } catch (error) {
      if (typeof error === "string") {
        setSubmitError(error);
        return;
      }

      setSubmitError("Failed to place order. Please try again.");
    }
  };

  const orderItems: CheckoutOrderItemViewModel[] = cartItems.map((cartItem) => {
    const itemTotalPrice = cartItem.price * cartItem.quantity;

    return {
      productId: cartItem.productId,
      title: cartItem.title,
      quantityText:
        cartItem.quantity === 1 ? "1 item" : `${cartItem.quantity} items`,
      priceText: `$${cartItem.price.toFixed(2)}`,
      itemTotalText: `$${itemTotalPrice.toFixed(2)}`,
    };
  });

  const totalQuantityText =
    totalQuantity === 1 ? "1 item in cart" : `${totalQuantity} items in cart`;

  const totalPriceText = `Total: $${totalPrice.toFixed(2)}`;

  return (
    <CheckoutPageView
      isCartEmpty={isCartEmpty}
      orderItems={orderItems}
      totalQuantityText={totalQuantityText}
      totalPriceText={totalPriceText}
      formValues={formValues}
      formErrors={formErrors}
      submitError={submitError ?? createError}
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
