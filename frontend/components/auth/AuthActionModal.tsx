"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LogIn, ShieldCheck, UserPlus, X } from "lucide-react";

type AuthActionModalProps = {
  open: boolean;
  onClose: () => void;
};

type AuthResponse = {
  success?: boolean;
  data?: {
    user?: {
      role?: string;
      authoritySubRole?: string;
    };
  };
  error?: {
    message?: string;
  };
};

type AuthMode = "login" | "signup";

function routeByRole(role?: string, authoritySubRole?: string) {
  if (role === "AUTHORITY" && authoritySubRole === "HEAD") {
    return "/dashboard/authority-head";
  }
  if (role === "AUTHORITY" && authoritySubRole === "WORKER") {
    return "/dashboard/authority-worker";
  }
  if (role === "ADMIN") {
    return "/dashboard/admin";
  }
  return "/dashboard/citizen?view=community_issues";
}

export function AuthActionModal({ open, onClose }: AuthActionModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(
    () => (mode === "login" ? "Login to continue" : "Create account to continue"),
    [mode]
  );

  const canSubmit = email.trim().length > 0 && password.trim().length > 0;

  if (!open) {
    return null;
  }

  const submit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setError(null);

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json().catch(() => null)) as AuthResponse | null;

      if (!response.ok || !payload?.success) {
        setError(payload?.error?.message ?? "Authentication failed.");
        return;
      }

      const target = routeByRole(payload.data?.user?.role, payload.data?.user?.authoritySubRole);
      onClose();
      router.replace(target);
      router.refresh();
    } catch {
      setError("Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/70 p-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close authentication modal"
        className="absolute inset-0"
        onClick={onClose}
      />

      <div className="relative z-10 mx-auto flex h-full max-w-4xl items-center justify-center">
        <section className="grid w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 md:grid-cols-[1.05fr_1fr]">
          <aside className="hidden bg-gradient-to-br from-[#0f172a] via-[#0f2a4a] to-[#1173d4] p-7 text-white md:flex md:flex-col md:justify-between">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/90">
                <ShieldCheck className="h-3.5 w-3.5" />
                CivicConnect Access
              </span>
              <h3 className="text-2xl font-black leading-tight tracking-tight">
                Continue this action with your account.
              </h3>
              <p className="max-w-xs text-sm leading-relaxed text-sky-100/90">
                Supporting and flagging issues is available to verified community users.
              </p>
            </div>

            <ul className="space-y-3 text-xs text-sky-100/90">
              <li className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
                Track your support activity from your dashboard.
              </li>
              <li className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
                Report and escalate issues with role-based workflows.
              </li>
            </ul>
          </aside>

          <form onSubmit={(event) => void submit(event)} className="relative space-y-5 p-5 sm:p-6">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Close authentication modal"
            >
              <X className="h-4 w-4" />
            </button>

            <header className="space-y-2 pr-10">
              <p className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-700 dark:border-sky-500/30 dark:bg-sky-900/30 dark:text-sky-200">
                {mode === "login" ? "Welcome Back" : "Join CivicConnect"}
              </p>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{title}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Support and flag actions require an authenticated account.
              </p>
            </header>

            <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                  mode === "login"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <LogIn className="h-3.5 w-3.5" />
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                  mode === "signup"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Sign Up
              </button>
            </div>

            <label className="space-y-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 dark:text-white"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 dark:text-white"
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </label>

            {mode === "signup" ? (
              <label className="space-y-2 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Confirm Password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 dark:text-white"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </label>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="flex w-full items-center justify-center rounded-full bg-[#1173d4] px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-white transition hover:-translate-y-0.5 hover:bg-[#0f66bd] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
