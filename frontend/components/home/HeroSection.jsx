import Link from "next/link";

export function HeroSection() {
  return (
    <section className="bg-[var(--background)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 py-20 text-center lg:py-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-sky-50/80 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-sky-700 shadow-sm dark:border-sky-500/20 dark:bg-sky-900/30 dark:text-sky-200">
          CivicConnect
        </div>
        <h1 className="mt-6 max-w-4xl text-balance text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-slate-100">
          Report. Track. Resolve Civic Issues Together.
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-sm text-slate-600 sm:text-base dark:text-slate-300">
          CivicConnect enables citizens to report issues, authorities to act faster, and communities to stay informed.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/issues"
            className="rounded-full bg-[#1173d4] px-6 py-3 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0f66bd]"
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
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
          <span>Trusted by Communities</span>
          <span>Transparent Updates</span>
          <span>Faster Resolutions</span>
        </div>
      </div>
    </section>
  );
}
