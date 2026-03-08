import Link from "next/link";

export default function WorkerDashboard() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Worker</p>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">Worker operations dashboard</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Track assigned tasks and complete status transitions from assigned to resolved.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/dashboard/worker/issues" className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Workflow</p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">Assigned issues</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Start and resolve assigned department issues.</p>
        </Link>
        <Link href="/dashboard/worker/settings" className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Account</p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">Settings</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Manage your account profile and password.</p>
        </Link>
      </div>
    </section>
  );
}
