export default function IssuesPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Public issues</p>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">Community issue map</h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
          This is a placeholder shell for Phase 1. In Phase 4, this page will load nearby public issues.
        </p>
      </header>
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Public issue list will render here.
      </div>
    </section>
  );
}
