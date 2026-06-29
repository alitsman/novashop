import { CrossIcon } from "../cross-icon";
import "./search-field.css";

type SearchFieldProps = {
  id: string;
  ariaLabel: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onClear: () => void;
};

export function SearchField({
  id,
  ariaLabel,
  value,
  placeholder,
  onChange,
  onClear,
}: SearchFieldProps) {
  const hasValue = value.length > 0;

  return (
    <div className="search-field">
      <div className="search-field__control">
        <input
          className="search-field__input"
          id={id}
          name="search"
          type="search"
          autoComplete="off"
          aria-label={ariaLabel}
          value={value}
          placeholder={placeholder}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        />

        {hasValue && (
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
