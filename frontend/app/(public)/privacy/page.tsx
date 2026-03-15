const sections = [
  {
    title: "Data We Collect",
    text: "We collect account identifiers, issue reports, optional location coordinates, and activity needed to operate workflows.",
  },
  {
    title: "How We Use Data",
    text: "Data is used for issue triage, assignment, progress tracking, notifications, and civic transparency reporting.",
  },
  {
    title: "Retention and Access",
    text: "Records are retained based on governance policy and available to authorized roles for operational and audit purposes.",
  },
];

export default function PrivacyPage() {
  return (
    <section className="space-y-8 py-8">
      <header className="space-y-4">
        <span className="w-fit rounded-full border border-sky-200 bg-sky-50 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-sky-700 dark:border-sky-500/30 dark:bg-sky-900/30 dark:text-sky-200">
          Legal
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Privacy Policy</h1>
      </header>

      <div className="space-y-4">
        {sections.map((section) => (
          <article key={section.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-[var(--home-surface)]">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{section.title}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{section.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
