import { type ChangeEventHandler, type FocusEventHandler } from "react";
import "./cart-quantity-control.css";

type CartQuantityControlViewProps = {
  inputId: string;
  hintId: string;
  errorId: string;
  title: string;
  inputValue: string;
  stock: number;
  availableMessage: string;
  errorMessage: string | null;
  canDecrease: boolean;
  canIncrease: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  onInputChange: ChangeEventHandler<HTMLInputElement>;
  onInputFocus: FocusEventHandler<HTMLInputElement>;
};

export function CartQuantityControlView({
  inputId,
  hintId,
  errorId,
  title,
  inputValue,
  stock,
  availableMessage,
  errorMessage,
  canDecrease,
  canIncrease,
  onDecrease,
  onIncrease,
  onInputChange,
  onInputFocus,
}: CartQuantityControlViewProps) {
  const describedBy = errorMessage ? `${hintId} ${errorId}` : hintId;

  return (
    <div className="cart-quantity-control">
      <p className="cart-quantity-control__hint" id={hintId}>
        {availableMessage}
      </p>
      <label className="cart-quantity-control__label" htmlFor={inputId}>
        Quantity for {title}
      </label>

      <div className="cart-quantity-control__row">
        <button
          className="cart-quantity-control__button"
          type="button"
          onClick={onDecrease}
          disabled={!canDecrease}
          aria-label={`Decrease quantity for ${title}`}
        >
          −
        </button>

        <input
          className="cart-quantity-control__input"
          id={inputId}
          type="number"
          min={1}
          max={stock}
          step={1}
          inputMode="numeric"
          value={inputValue}
          onChange={onInputChange}
          onFocus={onInputFocus}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={describedBy}
        />

        <button
          className="cart-quantity-control__button"
          type="button"
          onClick={onIncrease}
          disabled={!canIncrease}
          aria-label={`Increase quantity for ${title}`}
        >
          +
        </button>
      </div>

      {errorMessage && (
        <p className="cart-quantity-control__error" id={errorId} role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
