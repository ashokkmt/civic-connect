const DEFAULT_ACCURACY = 96;

export function MetricsSection({ stats, locationReady, loading, error }) {
  const metrics = [
    {
      label: "Pending Approvals",
      value: stats?.pendingApprovals ?? 0,
      helper: "Awaiting authority review",
    },
    {
      label: "Issues Resolved",
      value: stats?.resolved ?? 0,
      helper: "Closed by city workers",
    },
    {
      label: "Active Issues",
      value: stats?.inProgress ?? 0,
      helper: "Currently in progress",
    },
    {
      label: "Detection Accuracy",
      value: `${DEFAULT_ACCURACY}%`,
      helper: "Verified system accuracy",
    },
  ];

  return (
    <section className="bg-[var(--background)]">
      <div className="mx-auto w-full max-w-6xl px-6 py-16 lg:py-20">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-300">
            Civic Metrics
          </span>
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            Live public system metrics
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {loading
              ? "Refreshing from nearby issues..."
              : error
                ? "Metrics unavailable"
                : locationReady
                  ? "Updated from your saved location"
                  : "Set a location to enable live stats"}
          </p>
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                  {metric.label}
                </p>
              </div>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-white">
                {locationReady ? metric.value : "--"}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{metric.helper}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
