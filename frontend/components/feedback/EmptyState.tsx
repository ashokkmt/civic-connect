export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h3>
      {description ? <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{description}</p> : null}
    </div>
  );
}
