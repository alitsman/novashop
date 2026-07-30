import {
  type ChangeEventHandler,
  type ClipboardEventHandler,
  type FocusEventHandler,
  type KeyboardEventHandler,
  type RefCallback,
} from "react";
import "./cart-quantity-control.css";

type CartQuantityControlViewProps = {
  inputId: string;
  hintId: string;
  errorId: string;
  title: string;
  inputValue: string;
  stock: number;
  quantityHint: string;
  errorMessage: string | null;
  canDecrease: boolean;
  canIncrease: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  onInputChange: ChangeEventHandler<HTMLInputElement>;
  onInputFocus: FocusEventHandler<HTMLInputElement>;
  onInputKeyDown: KeyboardEventHandler<HTMLInputElement>;
  onInputPaste: ClipboardEventHandler<HTMLInputElement>;
  inputRef: RefCallback<HTMLInputElement>;
};

export function CartQuantityControlView({
  inputId,
  hintId,
  errorId,
  title,
  inputValue,
  stock,
  quantityHint,
  errorMessage,
  canDecrease,
  canIncrease,
  onDecrease,
  onIncrease,
  onInputChange,
  onInputFocus,
  onInputKeyDown,
  onInputPaste,
  inputRef,
}: CartQuantityControlViewProps) {
  const describedBy = errorMessage ? `${hintId} ${errorId}` : hintId;

  return (
    <div
      className="cart-quantity-control"
      role="group"
      aria-label={`Cart quantity controls for ${title}`}
    >
      <p className="cart-quantity-control__hint" id={hintId} data-testid="cart-quantity-hint">
        {quantityHint}
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
          onKeyDown={onInputKeyDown}
          onPaste={onInputPaste}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={describedBy}
          ref={inputRef}
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
