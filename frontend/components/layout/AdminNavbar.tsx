"use client";

import { useState } from "react";
import { Bell, LogOut, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import type { AdminView } from "@/components/layout/AdminSidebar";

type AdminNavbarProps = {
  activeView: AdminView;
  onRefresh: () => void;
  isRefreshing: boolean;
};

const VIEW_META: Record<AdminView, { title: string; subtitle: string }> = {
  overview: {
    title: "Admin Dashboard Overview",
    subtitle: "System-wide governance metrics and operational health indicators.",
  },
  departments: {
    title: "Department Management",
    subtitle: "Track department outcomes and manage department lifecycle controls.",
  },
  head_registration: {
    title: "Head Registration",
    subtitle: "Provision department head accounts with secure department assignment.",
  },
  escalations: {
    title: "System Escalations",
    subtitle: "Handle overdue and disputed cases that need admin-level intervention.",
  },
};

export function AdminNavbar({ activeView, onRefresh, isRefreshing }: AdminNavbarProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const current = VIEW_META[activeView];

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/85 px-4 py-4 backdrop-blur-xl sm:px-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Admin workspace</p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{current.title}</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{current.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <button
            type="button"
            className="relative rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-2.5 text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:text-zinc-900 dark:text-zinc-200 dark:hover:text-zinc-100"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing" : "Refresh"}
          </button>

          <button
            type="button"
            onClick={() => void logout()}
            disabled={isLoggingOut}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
          >
            <LogOut className="h-3.5 w-3.5" />
            {isLoggingOut ? "Logging out" : "Logout"}
          </button>
        </div>
      </div>
    </header>
  );
}
