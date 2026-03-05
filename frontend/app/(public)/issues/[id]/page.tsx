export default function IssueDetailPlaceholder() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Issue detail</p>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Issue details</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Placeholder detail view for Phase 1.
        </p>
      </header>
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Issue detail content will render here.
      </div>
    </section>
  );
}
