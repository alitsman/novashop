import { type KeyboardEvent, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { useToast } from "../../common/toast";
import {
  addToCart,
  clearCartError,
  selectCartError,
  selectCartItems,
} from "../../../features/cart/cartSlice";
import type { Product } from "../../../types/product";

type UseAddToCartControlParams = {
  product: Product;
  variant: "compact" | "full";
};

export function useAddToCartControl({
  product,
  variant,
}: UseAddToCartControlParams) {
  const dispatch = useAppDispatch();
  const showToast = useToast();

  const cartItems = useAppSelector(selectCartItems);
  const cartError = useAppSelector(selectCartError);

  const quantityInputRef = useRef<HTMLInputElement | null>(null);

  const [quantityValue, setQuantityValue] = useState("1");
  const [lastActionProductId, setLastActionProductId] = useState<string | null>(
    null,
  );

  const cartItemForProduct = cartItems.find((cartItem) => {
    return cartItem.productId === product.id;
  });

  const quantityInCart = cartItemForProduct?.quantity ?? 0;
  const availableToAdd = Math.max(product.stock - quantityInCart, 0);

  const parsedQuantity = Number(quantityValue);

  const isQuantityDisabled = availableToAdd <= 0;
  const minQuantity = 1;
  const maxQuantity = Math.max(availableToAdd, 1);

  const quantityInputId = `add-to-cart-${variant}-${product.id}-quantity`;
  const quantityHintId = `${quantityInputId}-hint`;
  const quantityErrorId = `${quantityInputId}-error`;

  const inCartMessage =
    quantityInCart > 0 ? `In cart: ${quantityInCart}` : null;

  const availableMessage =
    availableToAdd > 0
      ? `Available: ${availableToAdd}`
      : "No more items available";

  const quantityHint =
    availableToAdd > 1
      ? `Choose a quantity from 1 to ${availableToAdd}.`
      : availableToAdd === 1
        ? "Only 1 item can be added."
        : "This product cannot be added right now.";

  const quantityErrorMessage = getQuantityErrorMessage({
    quantity: parsedQuantity,
    availableToAdd,
  });

  const isQuantityValid = !quantityErrorMessage && availableToAdd > 0;

  const isDecreaseDisabled =
    isQuantityDisabled || !isQuantityValid || parsedQuantity <= minQuantity;

  const isIncreaseDisabled =
    isQuantityDisabled || !isQuantityValid || parsedQuantity >= maxQuantity;

  const isAddToCartDisabled = !isQuantityValid;

  const addToCartButtonLabel =
    availableToAdd > 0 ? "Add to cart" : "No more items available";

  const cartErrorMessage =
    lastActionProductId === product.id ? cartError : null;

  function handleQuantityChange(nextValue: string) {
    if (!/^\d+$/.test(nextValue)) {
      return;
    }

    setQuantityValue(nextValue);
    dispatch(clearCartError());
  }

  function handleQuantityFocus() {
    quantityInputRef.current?.select();
  }

  function handleQuantityKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const blockedKeys = ["e", "E", "+", "-", ".", ","];

    if (blockedKeys.includes(event.key)) {
      event.preventDefault();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      handleDecreaseQuantity();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      handleIncreaseQuantity();
    }
  }

  function handleDecreaseQuantity() {
    if (!isQuantityValid || parsedQuantity <= minQuantity) {
      return;
    }

    setQuantityValue(String(parsedQuantity - 1));
    dispatch(clearCartError());
  }

  function handleIncreaseQuantity() {
    if (!isQuantityValid || parsedQuantity >= maxQuantity) {
      return;
    }

    setQuantityValue(String(parsedQuantity + 1));
    dispatch(clearCartError());
  }

  function handleAddToCart() {
    if (!isQuantityValid) {
      quantityInputRef.current?.focus();
      return;
    }

    dispatch(clearCartError());

    dispatch(
      addToCart({
        productId: product.id,
        title: product.title,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity: parsedQuantity,
        stock: product.stock,
      }),
    );

    setLastActionProductId(product.id);
    showToast(`${product.title} added to cart.`);

    const nextAvailableToAdd = availableToAdd - parsedQuantity;

    if (nextAvailableToAdd > 0 && parsedQuantity > nextAvailableToAdd) {
      setQuantityValue("1");
    }
  }

  return {
    productTitle: product.title,

    quantityInputId,
    quantityHintId,
    quantityErrorId,
    quantityInputRef,

    quantityValue,
    minQuantity,
    maxQuantity,
    isQuantityDisabled,

    inCartMessage,
    availableMessage,
    quantityHint,
    quantityErrorMessage,
    cartErrorMessage,

    isDecreaseDisabled,
    isIncreaseDisabled,
    isAddToCartDisabled,
    addToCartButtonLabel,

    onQuantityChange: handleQuantityChange,
    onQuantityFocus: handleQuantityFocus,
    onQuantityKeyDown: handleQuantityKeyDown,
    onDecreaseQuantity: handleDecreaseQuantity,
    onIncreaseQuantity: handleIncreaseQuantity,
    onAddToCart: handleAddToCart,
  };
}

type QuantityValidationParams = {
  quantity: number;
  availableToAdd: number;
};

function getQuantityErrorMessage({
  quantity,
  availableToAdd,
}: QuantityValidationParams) {
  if (availableToAdd <= 0) {
    return null;
  }

  if (quantity < 1) {
    return "Quantity must be at least 1.";
  }

  if (quantity > availableToAdd) {
    return `Only ${availableToAdd} items are available to add.`;
  }

  return null;
}
