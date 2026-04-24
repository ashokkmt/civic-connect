"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

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

  if (!open) {
    return null;
  }

  const submit = async () => {
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
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Support and flag actions require an account.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Close authentication modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 text-xs dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-md px-3 py-1.5 font-semibold transition ${
                mode === "login" ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100" : "text-slate-500"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`rounded-md px-3 py-1.5 font-semibold transition ${
                mode === "signup" ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100" : "text-slate-500"
              }`}
            >
              Signup
            </button>
          </div>

          <label className="space-y-1 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              placeholder="you@example.com"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              placeholder="••••••••"
            />
          </label>

          {mode === "signup" ? (
            <label className="space-y-1 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Confirm password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                placeholder="••••••••"
              />
            </label>
          ) : null}

          {error ? <p className="text-xs text-red-600 dark:text-red-300">{error}</p> : null}

          <button
            type="button"
            onClick={() => void submit()}
            disabled={loading || !email.trim() || !password.trim()}
            className="w-full rounded-lg bg-[#1173d4] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0f66bd] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
          </button>
        </div>
      </div>
    </div>
  );
}
