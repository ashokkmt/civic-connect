type FormActionsProps = {
  submitLabel: string;
  isSubmitting?: boolean;
  secondaryAction?: React.ReactNode;
};

export function FormActions({ submitLabel, isSubmitting, secondaryAction }: FormActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900"
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
      {secondaryAction ? (
        <div className="text-xs text-zinc-500 dark:text-zinc-400">{secondaryAction}</div>
      ) : null}
    </div>
  );
}
