const terms = [
  {
    title: "Acceptable Use",
    text: "Users must provide accurate reports and avoid abusive, fraudulent, or harmful submissions.",
  },
  {
    title: "Account Responsibility",
    text: "You are responsible for safeguarding credentials and actions performed using your account.",
  },
  {
    title: "Platform Availability",
    text: "Service availability may vary due to maintenance, incident response, or scheduled updates.",
  },
];

export default function TermsPage() {
  return (
    <section className="space-y-8 py-8">
      <header className="space-y-4">
        <span className="w-fit rounded-full border border-sky-200 bg-sky-50 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-sky-700 dark:border-sky-500/30 dark:bg-sky-900/30 dark:text-sky-200">
          Legal
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Terms of Service</h1>
      </header>

      <div className="space-y-4">
        {terms.map((term) => (
          <article key={term.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-[var(--home-surface)]">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{term.title}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{term.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
