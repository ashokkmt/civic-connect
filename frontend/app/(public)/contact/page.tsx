export default function ContactPage() {
  return (
    <section className="space-y-8 py-8">
      <header className="space-y-4">
        <span className="w-fit rounded-full border border-sky-200 bg-sky-50 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-sky-700 dark:border-sky-500/30 dark:bg-sky-900/30 dark:text-sky-200">
          Contact
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Contact Support</h1>
        <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
          Reach out for account help, reporting issues, or platform feedback.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-[var(--home-surface)]">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Support</h2>
          <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">support@civicconnect.local</p>
        </article>
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-[var(--home-surface)]">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Partnerships</h2>
          <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">partnerships@civicconnect.local</p>
        </article>
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-[var(--home-surface)]">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">General</h2>
          <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">hello@civicconnect.local</p>
        </article>
      </div>
    </section>
  );
}
