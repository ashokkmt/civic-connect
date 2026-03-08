import Link from "next/link";

export default function AdminDashboard() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Admin</p>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">Admin provisioning dashboard</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Manage core system provisioning tasks supported by backend endpoints.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/admin/departments" className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Provisioning</p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">Create department</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Add a new department for issue ownership.</p>
        </Link>

        <Link href="/dashboard/admin/authorities" className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Provisioning</p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">Create authority head</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Register an authority head for a department.</p>
        </Link>

        <Link href="/dashboard/admin/settings" className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Account</p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">Settings</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Update admin account details and credentials.</p>
        </Link>
      </div>
    </section>
  );
}
