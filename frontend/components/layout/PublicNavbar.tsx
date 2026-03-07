"use client";

import React from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useLocation } from "@/lib/location/context";

export function PublicNavbar() {
  const { location } = useLocation();
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
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
          <Link className="text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white" href="/login">
            Login
          </Link>
          <Link className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--surface-muted)] dark:text-zinc-200" href="/register">
            Register
          </Link>
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
        </div>
      </div>

      {open ? (
        <div className="border-t border-[var(--border)] bg-[var(--surface)] px-6 py-4 md:hidden">
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
          </div>
        </div>
      ) : null}
    </header>
  );
}
