import type { ReactNode } from "react";
import "./select-field.css";

type SelectFieldBaseProps = {
  id: string;
  name: string;
  value: string;
  children: ReactNode;
  onChange: (value: string) => void;
};

type SelectFieldProps =
  | (SelectFieldBaseProps & {
      label: string;
      ariaLabel?: never;
    })
  | (SelectFieldBaseProps & {
      label?: never;
      ariaLabel: string;
    });

export function SelectField({
  id,
  name,
  label,
  ariaLabel,
  value,
  children,
  onChange,
}: SelectFieldProps) {
  return (
    <div className="select-field">
      {label && (
        <label className="select-field__label" htmlFor={id}>
          {label}
        </label>
      )}

      <div className="select-field__control">
        <select
          className="select-field__select"
          id={id}
          name={name}
          aria-label={ariaLabel}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        >
          {children}
        </select>
      </div>
    </div>
  );
}
