const faqs = [
  {
    q: "How do I report an issue?",
    a: "Create an account, set your location, and use the report flow to submit details and images.",
  },
  {
    q: "Can I track issue progress?",
    a: "Yes. You can view statuses from approval through resolution in your dashboard and public explorer.",
  },
  {
    q: "Who verifies reported issues?",
    a: "Department heads moderate and approve reports before assignments move to authority workers.",
  },
  {
    q: "How are escalations handled?",
    a: "Overdue issues are surfaced to governance views where admin roles can intervene.",
  },
];

export default function FaqPage() {
  return (
    <section className="space-y-8 py-8">
      <header className="space-y-4">
        <span className="w-fit rounded-full border border-sky-200 bg-sky-50 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-sky-700 dark:border-sky-500/30 dark:bg-sky-900/30 dark:text-sky-200">
          FAQ
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Frequently Asked Questions</h1>
      </header>

      <div className="space-y-4">
        {faqs.map((item) => (
          <article key={item.q} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-[var(--home-surface)]">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{item.q}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.a}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
