import {
  type ChangeEvent,
  type ClipboardEvent,
  type FocusEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useState,
  useCallback,
} from "react";
import {
  getDecreasedQuantity,
  getIncreasedQuantity,
  isQuantityDraftAllowed,
  isQuantityInputKeyBlocked,
} from "../../../utils/quantityInput";
import { CartQuantityControlView } from "./CartQuantityControlView";

type CartQuantityControlProps = {
  productId: string;
  title: string;
  quantity: number;
  stock: number;
  onQuantityChange: (productId: string, quantity: number) => void;
  onValidityChange: (productId: string, isValid: boolean) => void;
  onInputRef: (productId: string, input: HTMLInputElement | null) => void;
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
    return `Only ${stock} items are available in total.`;
  }

  return null;
}

export function CartQuantityControl({
  productId,
  title,
  quantity,
  stock,
  onQuantityChange,
  onValidityChange,
  onInputRef,
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

  const inputValue = inputDraft.sourceQuantity === quantity ? inputDraft.value : String(quantity);

  const errorMessage = validateQuantityInput(inputValue, stock);
  const parsedQuantity = Number(inputValue);
  const isQuantityEmpty = inputValue === "";

  const canDecrease = stock > 0 && !isQuantityEmpty && parsedQuantity > 1;
  const canIncrease = stock > 0 && !isQuantityEmpty && parsedQuantity < stock;

  const quantityHint = `Choose a quantity from 1 to ${stock}.`;

  useEffect(() => {
    onValidityChange(productId, !errorMessage);
  }, [errorMessage, onValidityChange, productId]);

  useEffect(() => {
    return () => {
      onValidityChange(productId, true);
    };
  }, [onValidityChange, productId]);

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

    updateQuantity(getDecreasedQuantity(parsedQuantity, stock));
  };

  const handleIncrease = () => {
    if (!canIncrease) {
      return;
    }

    updateQuantity(getIncreasedQuantity(parsedQuantity, 1));
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;

    if (!isQuantityDraftAllowed(nextValue)) {
      return;
    }

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

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (isQuantityInputKeyBlocked(event.key)) {
      event.preventDefault();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      handleDecrease();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      handleIncrease();
    }
  };

  const handleInputPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pastedText = event.clipboardData.getData("text");

    if (!isQuantityDraftAllowed(pastedText)) {
      event.preventDefault();
    }
  };

  const handleInputRef = useCallback(
    (input: HTMLInputElement | null) => {
      onInputRef(productId, input);
    },
    [onInputRef, productId],
  );

  return (
    <CartQuantityControlView
      inputId={inputId}
      hintId={hintId}
      errorId={errorId}
      title={title}
      inputValue={inputValue}
      stock={stock}
      quantityHint={quantityHint}
      errorMessage={errorMessage}
      canDecrease={canDecrease}
      canIncrease={canIncrease}
      onDecrease={handleDecrease}
      onIncrease={handleIncrease}
      onInputChange={handleInputChange}
      onInputFocus={handleInputFocus}
      onInputKeyDown={handleInputKeyDown}
      onInputPaste={handleInputPaste}
      inputRef={handleInputRef}
    />
  );
}
