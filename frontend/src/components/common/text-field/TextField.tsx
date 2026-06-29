import type { Ref } from "react";
import "./text-field.css";

export type TextFieldType =
  | "text"
  | "email"
  | "password"
  | "tel"
  | "url"
  | "number";

type TextFieldInputMode =
  | "none"
  | "text"
  | "tel"
  | "url"
  | "email"
  | "numeric"
  | "decimal"
  | "search";

type TextFieldProps = {
  id: string;
  name: string;
  label: string;
  type?: TextFieldType;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
  inputMode?: TextFieldInputMode;
  min?: string;
  max?: string;
  step?: string;
  error?: string;
  hint?: string;
  inputRef?: Ref<HTMLInputElement>;
};

const getDescribedBy = ({
  hintId,
  errorId,
  hasHint,
  hasError,
}: {
  hintId: string;
  errorId: string;
  hasHint: boolean;
  hasError: boolean;
}) => {
  const describedByIds = [];

  if (hasHint) {
    describedByIds.push(hintId);
  }

  if (hasError) {
    describedByIds.push(errorId);
  }

  return describedByIds.length > 0 ? describedByIds.join(" ") : undefined;
};

export function TextField({
  id,
  name,
  label,
  type = "text",
  value,
  onChange,
  required = false,
  autoComplete,
  inputMode,
  min,
  max,
  step,
  error,
  hint,
  inputRef,
}: TextFieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const hasError = Boolean(error);
  const hasHint = Boolean(hint);

  const describedBy = getDescribedBy({
    hintId,
    errorId,
    hasHint,
    hasError,
  });

  return (
    <div className="text-field">
      <label className="text-field__label" htmlFor={id}>
        {label}{" "}
        {required && (
          <span className="text-field__required-mark" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <input
        className="text-field__input"
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        min={min}
        max={max}
        step={step}
        ref={inputRef}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        required={required}
        aria-invalid={hasError}
        aria-describedby={describedBy}
      />

      {hint && (
        <p className="text-field__hint" id={hintId}>
          {hint}
        </p>
      )}

      {error && (
        <p className="text-field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
