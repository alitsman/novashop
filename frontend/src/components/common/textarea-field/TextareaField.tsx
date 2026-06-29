import type { Ref } from "react";
import "./textarea-field.css";

type TextareaFieldProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
  rows?: number;
  error?: string;
  hint?: string;
  textareaRef?: Ref<HTMLTextAreaElement>;
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

export function TextareaField({
  id,
  name,
  label,
  value,
  onChange,
  required = false,
  autoComplete,
  rows = 4,
  error,
  hint,
  textareaRef,
}: TextareaFieldProps) {
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
    <div className="textarea-field">
      <label className="textarea-field__label" htmlFor={id}>
        {label}{" "}
        {required && (
          <span className="textarea-field__required-mark" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <textarea
        className="textarea-field__textarea"
        id={id}
        name={name}
        rows={rows}
        autoComplete={autoComplete}
        ref={textareaRef}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        required={required}
        aria-invalid={hasError}
        aria-describedby={describedBy}
      />

      {hint && (
        <p className="textarea-field__hint" id={hintId}>
          {hint}
        </p>
      )}

      {error && (
        <p className="textarea-field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
