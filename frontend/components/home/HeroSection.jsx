import Link from "next/link";

export function HeroSection() {
  return (
    <section className="bg-[var(--background)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 py-20 text-center lg:py-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50/70 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-700 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-900/30 dark:text-emerald-200">
          CivicConnect
        </div>
        <h1 className="mt-6 max-w-4xl text-balance text-4xl font-semibold text-zinc-900 sm:text-5xl lg:text-6xl dark:text-white">
          Report. Track. Resolve Civic Issues Together.
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-sm text-zinc-600 sm:text-base dark:text-zinc-300">
          CivicConnect enables citizens to report issues, authorities to act faster, and communities to stay informed.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/issues"
            className="rounded-full bg-zinc-900 px-6 py-3 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
          >
            Explore Issues Near You
          </Link>
          <Link
            href="/register"
            className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-3 text-xs font-semibold text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--surface-muted)] dark:text-zinc-200"
          >
            Report an Issue
          </Link>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-400">
          <span>Trusted by Communities</span>
          <span>Transparent Updates</span>
          <span>Faster Resolutions</span>
        </div>
      </div>
    </section>
  );
}
