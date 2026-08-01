import { type ClipboardEvent, type KeyboardEvent, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { useToast } from "../../common/toast";
import {
  addToCart,
  clearCartError,
  selectCartError,
  selectCartItems,
} from "../../../features/cart/cartSlice";
import type { Product } from "../../../types/product";
import {
  getDecreasedQuantity,
  getIncreasedQuantity,
  isQuantityDraftAllowed,
  isQuantityInputKeyBlocked,
} from "../../../utils/quantityInput";

type UseAddToCartControlParams = {
  product: Product;
  variant: "compact" | "full";
};

export function useAddToCartControl({ product, variant }: UseAddToCartControlParams) {
  const dispatch = useAppDispatch();
  const showToast = useToast();

  const cartItems = useAppSelector(selectCartItems);
  const cartError = useAppSelector(selectCartError);

  const quantityInputRef = useRef<HTMLInputElement | null>(null);

  const [quantityValue, setQuantityValue] = useState("1");
  const [lastActionProductId, setLastActionProductId] = useState<string | null>(null);

  const cartItemForProduct = cartItems.find((cartItem) => {
    return cartItem.productId === product.id;
  });

  const quantityInCart = cartItemForProduct?.quantity ?? 0;
  const availableToAdd = Math.max(product.stock - quantityInCart, 0);

  const parsedQuantity = Number(quantityValue);
  const isQuantityEmpty = quantityValue === "";

  const isQuantityDisabled = availableToAdd <= 0;
  const minQuantity = 1;
  const maxQuantity = Math.max(availableToAdd, 1);

  const quantityInputId = `add-to-cart-${variant}-${product.id}-quantity`;
  const quantityHintId = `${quantityInputId}-hint`;
  const quantityErrorId = `${quantityInputId}-error`;

  const inCartMessage = quantityInCart > 0 ? `In cart: ${quantityInCart}` : null;

  const availableMessage =
    availableToAdd > 0 ? `Available: ${availableToAdd}` : "No more items available";

  const quantityHint =
    availableToAdd > 1
      ? `Choose a quantity from 1 to ${availableToAdd}.`
      : availableToAdd === 1
        ? "Only 1 item can be added."
        : "This product cannot be added right now.";

  const quantityErrorMessage = getQuantityErrorMessage({
    quantityValue,
    quantity: parsedQuantity,
    availableToAdd,
  });

  const isQuantityValid = !quantityErrorMessage && availableToAdd > 0;

  const isDecreaseDisabled = isQuantityDisabled || isQuantityEmpty || parsedQuantity <= minQuantity;

  const isIncreaseDisabled = isQuantityDisabled || isQuantityEmpty || parsedQuantity >= maxQuantity;

  const isAddToCartDisabled = !isQuantityValid;

  const addToCartButtonLabel = availableToAdd > 0 ? "Add to cart" : "No more items available";

  const addToCartButtonAriaLabel =
    availableToAdd > 0
      ? `Add to cart: ${product.title}`
      : `No more items available for ${product.title}`;

  const cartErrorMessage = lastActionProductId === product.id ? cartError : null;

  function handleQuantityChange(nextValue: string) {
    if (!isQuantityDraftAllowed(nextValue)) {
      return;
    }

    setQuantityValue(nextValue);
    dispatch(clearCartError());
  }

  function handleQuantityFocus() {
    quantityInputRef.current?.select();
  }

  function handleQuantityKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (isQuantityInputKeyBlocked(event.key)) {
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

  function handleQuantityPaste(event: ClipboardEvent<HTMLInputElement>) {
    const pastedText = event.clipboardData.getData("text");

    if (!isQuantityDraftAllowed(pastedText)) {
      event.preventDefault();
    }
  }

  function handleDecreaseQuantity() {
    if (isDecreaseDisabled) {
      return;
    }

    const nextQuantity = getDecreasedQuantity(parsedQuantity, maxQuantity);

    setQuantityValue(String(nextQuantity));
    dispatch(clearCartError());
  }

  function handleIncreaseQuantity() {
    if (isIncreaseDisabled) {
      return;
    }

    const nextQuantity = getIncreasedQuantity(parsedQuantity, minQuantity);

    setQuantityValue(String(nextQuantity));
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
    setQuantityValue("1");
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
    addToCartButtonAriaLabel,

    onQuantityChange: handleQuantityChange,
    onQuantityFocus: handleQuantityFocus,
    onQuantityKeyDown: handleQuantityKeyDown,
    onQuantityPaste: handleQuantityPaste,
    onDecreaseQuantity: handleDecreaseQuantity,
    onIncreaseQuantity: handleIncreaseQuantity,
    onAddToCart: handleAddToCart,
  };
}

type QuantityValidationParams = {
  quantityValue: string;
  quantity: number;
  availableToAdd: number;
};

function getQuantityErrorMessage({
  quantityValue,
  quantity,
  availableToAdd,
}: QuantityValidationParams) {
  if (availableToAdd <= 0) {
    return null;
  }

  if (quantityValue === "") {
    return "Enter a quantity.";
  }

  if (quantity < 1) {
    return "Quantity must be at least 1.";
  }

  if (quantity > availableToAdd) {
    return `Only ${availableToAdd} items are available to add.`;
  }

  return null;
}
