type TextAreaProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  rows?: number;
};

export function TextArea({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  helperText,
  rows = 4,
}: TextAreaProps) {
  return (
    <label className="space-y-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
      <span className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <textarea
        id={id}
        value={value}
        required={required}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
      />
      {helperText ? (
        <span className="block text-xs text-zinc-500 dark:text-zinc-400">{helperText}</span>
      ) : null}
    </label>
  );
}
