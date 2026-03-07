type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "password";
  required?: boolean;
  helperText?: string;
  disabled?: boolean;
};

export function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  helperText,
  disabled,
}: TextFieldProps) {
  return (
    <label className="space-y-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
      <span className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-100"
      />
      {helperText ? (
        <span className="block text-xs text-zinc-500 dark:text-zinc-400">{helperText}</span>
      ) : null}
    </label>
  );
}
