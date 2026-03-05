export default function DashboardHome() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Dashboard</p>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">Welcome to CivicConnect</h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
          Phase 1 layout shell. Role routing and data will be added in Phase 2 and Phase 3.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          "Citizen workspace",
          "Authority head workspace",
          "Worker workspace",
        ].map((label) => (
          <div
            key={label}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-sm text-zinc-600 dark:text-zinc-300"
          >
            {label}
          </div>
        ))}
      </div>
    </section>
  );
}
