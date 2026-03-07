import { EmptyState } from "@/components/feedback/EmptyState";
import { LoadingSkeleton } from "@/components/feedback/LoadingSkeleton";
import { StatusBadge } from "@/components/issues/StatusBadge";

export function RecentIssuesSlider({ issues, locationReady, loading, error }) {
  if (!locationReady) {
    return (
      <section className="bg-[var(--background)]">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 lg:py-20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
                Recent Issues
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-zinc-900 dark:text-white">
                Platform activity near you
              </h2>
            </div>
          </div>
          <div className="mt-8">
            <EmptyState
              title="Set a location to see recent activity"
              description="We only show public activity once a location is saved."
            />
          </div>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="bg-[var(--background)]">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 lg:py-20">
          <LoadingSkeleton label="Loading recent issues" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-[var(--background)]">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 lg:py-20">
          <EmptyState title="Unable to load recent issues" description={error} />
        </div>
      </section>
    );
  }

  if (!issues.length) {
    return (
      <section className="bg-[var(--background)]">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 lg:py-20">
          <EmptyState title="No recent issues yet" description="New activity will appear here." />
        </div>
      </section>
    );
  }

  const shouldSlide = issues.length > 4;
  const loopItems = shouldSlide ? [...issues, ...issues] : issues;

  return (
    <section className="bg-[var(--background)]">
      <div className="mx-auto w-full max-w-6xl px-6 py-16 lg:py-20">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-300">
            Recent Issues
          </span>
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            Transparency in motion
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Showing latest public updates</p>
        </div>

        <div className="relative mt-8">
          {shouldSlide ? (
            <>
              <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[var(--background)] to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[var(--background)] to-transparent" />
            </>
          ) : null}
          {shouldSlide ? (
            <div className="overflow-hidden">
              <div className="flex w-max gap-4 animate-marquee hover:[animation-play-state:paused]">
                {loopItems.map((issue, index) => (
                  <article
                    key={`${issue.id}-${index}`}
                    className="min-w-[300px] rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 shadow-sm transition hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-zinc-900 line-clamp-2 dark:text-white">
                        {issue.title}
                      </p>
                      <StatusBadge status={issue.status} />
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-12 w-16 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20" />
                      <div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {issue.category ? `${issue.category} Department` : "Civic Department"}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Near your saved area</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="rounded-full border border-[var(--border)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                        {issue.severity ?? "Active"}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : "Update pending"}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {issues.map((issue) => (
                <article
                  key={issue.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 shadow-sm transition hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-zinc-900 line-clamp-2 dark:text-white">
                      {issue.title}
                    </p>
                    <StatusBadge status={issue.status} />
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-12 w-16 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20" />
                    <div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {issue.category ? `${issue.category} Department` : "Civic Department"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Near your saved area</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="rounded-full border border-[var(--border)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                      {issue.severity ?? "Active"}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : "Update pending"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
