export default function LoginPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Welcome back</p>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Login</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Phase 1 placeholder. Authentication wiring will be implemented in Phase 2.
        </p>
      </header>
      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)] p-6 text-sm text-zinc-500 dark:text-zinc-400">
        Login form will render here.
      </div>
    </div>
  );
}
