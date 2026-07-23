import type { ReactNode } from "react";
import "./select-field.css";

type SelectFieldProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  children: ReactNode;
  onChange: (value: string) => void;
};

export function SelectField({ id, name, label, value, children, onChange }: SelectFieldProps) {
  return (
    <div className="select-field">
      <label className="select-field__label" htmlFor={id}>
        {label}
      </label>

      <div className="select-field__control">
        <select
          className="select-field__select"
          id={id}
          name={name}
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
