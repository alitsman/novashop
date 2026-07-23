import { CrossIcon } from "../cross-icon";
import "./search-field.css";

type SearchFieldProps = {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onClear: () => void;
};

export function SearchField({
  id,
  label,
  value,
  placeholder,
  onChange,
  onClear,
}: SearchFieldProps) {
  return (
    <div className="search-field">
      <label className="search-field__label" htmlFor={id}>
        {label}
      </label>

      <div className="search-field__control">
        <input
          className="search-field__input"
          id={id}
          name="search"
          type="search"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        />

        {value.length > 0 && (
          <button
            className="search-field__clear-button"
            type="button"
            aria-label="Clear search"
            onClick={onClear}
          >
            <CrossIcon />
          </button>
        )}
      </div>
    </div>
  );
}
