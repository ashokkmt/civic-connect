import Link from "next/link";

export default function HeadDashboard() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Authority head</p>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">Head operations dashboard</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Moderate pending reports, create worker accounts, and close verified issues.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/head/pending" className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Moderation</p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">Pending issues</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Approve or reject incoming reports.</p>
        </Link>
        <Link href="/dashboard/head/workers" className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Provisioning</p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">Create worker</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Add authority workers for your department.</p>
        </Link>
        <Link href="/dashboard/head/close" className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Closure</p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">Close by ID</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Finalize issues awaiting head closure.</p>
        </Link>
      </div>
    </section>
  );
}
