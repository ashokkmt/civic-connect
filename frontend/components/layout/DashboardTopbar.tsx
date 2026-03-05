"use client";

import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useLocation } from "@/lib/location/context";

export function DashboardTopbar() {
  const { location } = useLocation();

  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">CivicConnect</p>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Dashboard</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1 text-xs text-zinc-600 dark:text-zinc-300 sm:flex">
          <span className="font-semibold">Loc</span>
          <span>{location ? `${location.lat.toFixed(3)}, ${location.lng.toFixed(3)}` : "Not set"}</span>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
}
