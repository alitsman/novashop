import type { KeyboardEvent, RefObject } from "react";
import { Button } from "../../common/button";
import "./add-to-cart-control.css";

export type AddToCartControlVariant = "compact" | "full";

type AddToCartControlViewProps = {
  variant: AddToCartControlVariant;
  productTitle: string;

  quantityInputId: string;
  quantityHintId: string;
  quantityErrorId: string;
  quantityInputRef: RefObject<HTMLInputElement | null>;

  quantityValue: string;
  minQuantity: number;
  maxQuantity: number;
  isQuantityDisabled: boolean;

  inCartMessage: string | null;
  availableMessage: string;
  quantityHint: string;
  quantityErrorMessage: string | null;
  cartErrorMessage: string | null;

  isDecreaseDisabled: boolean;
  isIncreaseDisabled: boolean;
  isAddToCartDisabled: boolean;
  addToCartButtonLabel: string;

  onQuantityChange: (value: string) => void;
  onQuantityFocus: () => void;
  onQuantityKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onDecreaseQuantity: () => void;
  onIncreaseQuantity: () => void;
  onAddToCart: () => void;
};

export function AddToCartControlView({
  variant,
  productTitle,
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
  onQuantityChange,
  onQuantityFocus,
  onQuantityKeyDown,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onAddToCart,
}: AddToCartControlViewProps) {
  const describedBy = quantityErrorMessage
    ? `${quantityHintId} ${quantityErrorId}`
    : quantityHintId;

  return (
    <div
      className={`add-to-cart-control add-to-cart-control--${variant}`}
      role="group"
      aria-label={`Add ${productTitle} to cart`}
    >
      <div className="add-to-cart-control__availability">
        {inCartMessage && (
          <p className="add-to-cart-control__availability-item">
            {inCartMessage}
          </p>
        )}

        <p className="add-to-cart-control__availability-item">
          {availableMessage}
        </p>
      </div>

      <div className="add-to-cart-control__field">
        <label className="add-to-cart-control__label" htmlFor={quantityInputId}>
          Quantity for {productTitle}
        </label>

        <div className="add-to-cart-control__quantity-row">
          <button
            className="add-to-cart-control__quantity-button"
            type="button"
            disabled={isDecreaseDisabled}
            aria-label={`Decrease quantity for ${productTitle}`}
            onClick={onDecreaseQuantity}
          >
            −
          </button>

          <input
            ref={quantityInputRef}
            className="add-to-cart-control__quantity-input"
            id={quantityInputId}
            type="number"
            min={minQuantity}
            max={maxQuantity}
            step={1}
            inputMode="numeric"
            value={quantityValue}
            disabled={isQuantityDisabled}
            aria-invalid={Boolean(quantityErrorMessage)}
            aria-describedby={describedBy}
            onChange={(event) => onQuantityChange(event.target.value)}
            onFocus={onQuantityFocus}
            onKeyDown={onQuantityKeyDown}
          />

          <button
            className="add-to-cart-control__quantity-button"
            type="button"
            disabled={isIncreaseDisabled}
            aria-label={`Increase quantity for ${productTitle}`}
            onClick={onIncreaseQuantity}
          >
            +
          </button>
        </div>

        <p className="add-to-cart-control__hint" id={quantityHintId}>
          {quantityHint}
        </p>

        {quantityErrorMessage && (
          <p
            className="add-to-cart-control__message add-to-cart-control__message--error"
            id={quantityErrorId}
            role="alert"
          >
            {quantityErrorMessage}
          </p>
        )}
      </div>

      {cartErrorMessage && (
        <div className="add-to-cart-control__feedback">
          <p
            className="add-to-cart-control__message add-to-cart-control__message--error"
            role="alert"
          >
            {cartErrorMessage}
          </p>
        </div>
      )}

      <Button
        className="add-to-cart-control__submit"
        disabled={isAddToCartDisabled}
        aria-label={`Add ${productTitle} to cart`}
        onClick={onAddToCart}
      >
        {addToCartButtonLabel}
      </Button>
    </div>
  );
}
