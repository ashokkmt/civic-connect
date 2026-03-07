"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useLocation } from "@/lib/location/context";

type MeResponse = {
  success: boolean;
  data?: { user?: { email?: string } };
};

export function PublicNavbar() {
  const { location } = useLocation();
  const [open, setOpen] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/auth/me", { method: "GET" });
        const payload = (await response.json()) as MeResponse;
        setIsLoggedIn(response.ok && payload.success);
      } catch {
        setIsLoggedIn(false);
      }
    };

    load();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setIsLoggedIn(false);
      router.push("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-sm">
            CC
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">CivicConnect</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Community issue reporting</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link className="text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white" href="/">
            Home
          </Link>
          <Link className="text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white" href="/issues">
            Issues
          </Link>
          {!isLoggedIn ? (
            <>
              <Link className="text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white" href="/login">
                Login
              </Link>
              <Link className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--surface-muted)] dark:text-zinc-200" href="/register">
                Register
              </Link>
            </>
          ) : null}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1 text-xs text-zinc-600 dark:text-zinc-300 sm:flex">
            <span className="font-semibold">Loc</span>
            <span>
              {location ? `${location.lat.toFixed(3)}, ${location.lng.toFixed(3)}` : "Not set"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-zinc-600 transition hover:bg-[var(--surface-muted)] dark:text-zinc-300 md:hidden"
            aria-label="Toggle menu"
          >
            <span className="text-base">☰</span>
          </button>
          <ThemeToggle />
          {isLoggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold text-zinc-600 transition hover:bg-[var(--surface-muted)] dark:text-zinc-200"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          ) : null}
        </div>
      </div>

      {open ? (
        <div className="border-t border-[var(--border)] bg-[var(--surface)] px-6 py-4 md:hidden lg:px-8">
          <div className="flex flex-col gap-3 text-sm font-medium">
            <Link
              className="text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
              href="/"
              onClick={() => setOpen(false)}
            >
              Home
            </Link>
            <Link
              className="text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
              href="/issues"
              onClick={() => setOpen(false)}
            >
              Issues
            </Link>
            {!isLoggedIn ? (
              <>
                <Link
                  className="text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
                  href="/login"
                  onClick={() => setOpen(false)}
                >
                  Login
                </Link>
                <Link
                  className="text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
                  href="/register"
                  onClick={() => setOpen(false)}
                >
                  Register
                </Link>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                }}
                className="text-left text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
