type SelectOption = {
  value: string;
  label: string;
};

type SelectFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  required?: boolean;
  helperText?: string;
};

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  required,
  helperText,
}: SelectFieldProps) {
  return (
    <label className="space-y-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
      <span className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <select
        id={id}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText ? (
        <span className="block text-xs text-zinc-500 dark:text-zinc-400">{helperText}</span>
      ) : null}
    </label>
  );
}
