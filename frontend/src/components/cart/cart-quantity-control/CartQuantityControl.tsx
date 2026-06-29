import { type ChangeEvent, type FocusEvent, useId, useState } from "react";
import { CartQuantityControlView } from "./CartQuantityControlView";

type CartQuantityControlProps = {
  productId: string;
  title: string;
  quantity: number;
  stock: number;
  onQuantityChange: (productId: string, quantity: number) => void;
};

// sourceQuantity is the external quantity this draft was created from.
// If quantity changes from outside, the draft is ignored and the new quantity is shown.
type QuantityInputDraft = {
  value: string;
  sourceQuantity: number;
};

function validateQuantityInput(value: string, stock: number): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "Enter a quantity.";
  }

  const parsedQuantity = Number(trimmedValue);

  if (!Number.isInteger(parsedQuantity)) {
    return "Quantity must be a whole number.";
  }

  if (parsedQuantity < 1) {
    return "Quantity must be at least 1.";
  }

  if (parsedQuantity > stock) {
    return `Only ${stock} items are available in stock.`;
  }

  return null;
}

export function CartQuantityControl({
  productId,
  title,
  quantity,
  stock,
  onQuantityChange,
}: CartQuantityControlProps) {
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();

  const [inputDraft, setInputDraft] = useState<QuantityInputDraft>(() => {
    return {
      value: String(quantity),
      sourceQuantity: quantity,
    };
  });

  const inputValue =
    inputDraft.sourceQuantity === quantity
      ? inputDraft.value
      : String(quantity);

  const errorMessage = validateQuantityInput(inputValue, stock);
  const hasError = Boolean(errorMessage);

  const canDecrease = !hasError && quantity > 1;
  const canIncrease = !hasError && quantity < stock;

  const availableMessage = `Available: ${stock}`;

  const updateQuantity = (nextQuantity: number) => {
    setInputDraft({
      value: String(nextQuantity),
      // Keep the current external quantity so the local draft is shown
      // until the parent commits the new quantity back through props.
      sourceQuantity: quantity,
    });

    onQuantityChange(productId, nextQuantity);
  };

  const handleDecrease = () => {
    if (!canDecrease) {
      return;
    }

    updateQuantity(quantity - 1);
  };

  const handleIncrease = () => {
    if (!canIncrease) {
      return;
    }

    updateQuantity(quantity + 1);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;

    setInputDraft({
      value: nextValue,
      sourceQuantity: quantity,
    });

    const validationError = validateQuantityInput(nextValue, stock);

    if (validationError) {
      return;
    }

    const nextQuantity = Number(nextValue);

    if (nextQuantity === quantity) {
      return;
    }

    onQuantityChange(productId, nextQuantity);
  };

  const handleInputFocus = (event: FocusEvent<HTMLInputElement>) => {
    event.target.select();
  };

  return (
    <CartQuantityControlView
      inputId={inputId}
      hintId={hintId}
      errorId={errorId}
      title={title}
      inputValue={inputValue}
      stock={stock}
      availableMessage={availableMessage}
      errorMessage={errorMessage}
      canDecrease={canDecrease}
      canIncrease={canIncrease}
      onDecrease={handleDecrease}
      onIncrease={handleIncrease}
      onInputChange={handleInputChange}
      onInputFocus={handleInputFocus}
    />
  );
}
