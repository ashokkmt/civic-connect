const pillars = [
  "Transparency-first civic operations",
  "Faster response through clear assignment",
  "Accountability through lifecycle visibility",
  "Citizen-centric reporting experience",
];

export default function MissionPage() {
  return (
    <section className="space-y-8 py-8">
      <header className="space-y-4">
        <span className="w-fit rounded-full border border-sky-200 bg-sky-50 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-sky-700 dark:border-sky-500/30 dark:bg-sky-900/30 dark:text-sky-200">
          Mission
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Why CivicConnect Exists</h1>
        <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
          We build reliable civic reporting infrastructure that helps communities and authorities solve real issues faster.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {pillars.map((pillar) => (
          <article key={pillar} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-[var(--home-surface)]">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{pillar}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
