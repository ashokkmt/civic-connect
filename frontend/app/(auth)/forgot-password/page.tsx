import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-3 text-center">
        <span className="mx-auto inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-sky-700 dark:border-sky-500/30 dark:bg-sky-900/30 dark:text-sky-200">
          Account Recovery
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Forgot your password?</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Password reset self-service is being finalized. Contact support to securely recover access.
        </p>
      </header>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 dark:bg-[var(--home-surface)]">
        <p className="text-sm text-slate-600 dark:text-slate-300">Support Email: support@civicconnect.local</p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Include your registered email and role, and the team will guide you through verification.
        </p>
      </div>

      <div className="text-center text-xs text-slate-500 dark:text-slate-400">
        Remembered your password?{" "}
        <Link href="/login" className="font-semibold text-sky-600 hover:text-sky-500 dark:text-sky-300">
          Back to login
        </Link>
      </div>
    </div>
  );
}
