import { useDeferredValue, useState } from "react";

export interface FilterableSelectOption {
  value: string;
  label: string;
}

interface FilterableSelectProps {
  className?: string;
  disabled?: boolean;
  emptyOptionLabel: string;
  noResultsLabel?: string;
  onChange: (value: string) => void;
  options: FilterableSelectOption[];
  required?: boolean;
  searchClassName?: string;
  searchLabel: string;
  searchPlaceholder?: string;
  selectAriaLabel?: string;
  selectClassName?: string;
  value: string;
}

export function FilterableSelect({
  className,
  disabled = false,
  emptyOptionLabel,
  noResultsLabel = "Žiadne výsledky pre filter.",
  onChange,
  options,
  required = false,
  searchClassName,
  searchLabel,
  searchPlaceholder = "Filtrovať možnosti...",
  selectAriaLabel,
  selectClassName,
  value,
}: FilterableSelectProps) {
  const [search, setSearch] = useState("");
  const normalizedSearch = useDeferredValue(search.trim().toLocaleLowerCase("sk-SK"));

  const selectedOption = options.find((option) => option.value === value);
  const filteredOptions = options.filter((option) => option.label.toLocaleLowerCase("sk-SK").includes(normalizedSearch));
  const visibleOptions = selectedOption && value && !filteredOptions.some((option) => option.value === selectedOption.value)
    ? [selectedOption, ...filteredOptions]
    : filteredOptions;
  const helperText = search
    ? filteredOptions.length === 0
      ? noResultsLabel
      : `Zobrazených ${filteredOptions.length} z ${options.length} možností.`
    : null;

  return (
    <div className={className}>
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={searchPlaceholder}
        aria-label={searchLabel}
        disabled={disabled || options.length === 0}
        className={searchClassName ?? "input mb-2"}
      />
      <select
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setSearch("");
        }}
        aria-label={selectAriaLabel ?? searchLabel}
        disabled={disabled || options.length === 0}
        required={required}
        className={selectClassName ?? "input"}
      >
        <option value="">{emptyOptionLabel}</option>
        {visibleOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {helperText && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
    </div>
  );
}