"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, Menu, Search, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import type { HeadView } from "@/components/dashboards/authority-head/types";

type AuthorityHeadNavbarProps = {
  activeView: HeadView;
  onToggleMobileMenu: () => void;
};

const VIEW_META: Record<HeadView, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Dashboard Overview",
    subtitle: "Real-time performance metrics and operations monitoring.",
  },
  pending_issues: {
    title: "Pending Issues Moderation",
    subtitle: "Review and approve citizen-reported infrastructure and safety concerns.",
  },
  worker_analytics: {
    title: "Worker Analytics",
    subtitle: "Compare output, pending load, and success rate across your team.",
  },
  worker_management: {
    title: "Worker Management",
    subtitle: "Assign issues, register workers, and monitor capacity in one place.",
  },
  resolved_issues: {
    title: "Resolved Issues",
    subtitle: "Review completed work and close issues awaiting confirmation.",
  },
  escalations: {
    title: "Escalations",
    subtitle: "Monitor unresolved cases and reassign critical incidents quickly.",
  },
};

export function AuthorityHeadNavbar({ activeView, onToggleMobileMenu }: AuthorityHeadNavbarProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const current = VIEW_META[activeView];

  useEffect(() => {
    if (!profileOpen) {
      return;
    }

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current) {
        return;
      }

      if (!menuRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    window.addEventListener("click", closeOnOutsideClick);
    return () => window.removeEventListener("click", closeOnOutsideClick);
  }, [profileOpen]);

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]/95 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-2 text-slate-600 dark:text-slate-300"
              aria-label="Open authority head menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Authority head workspace</p>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">{current.title}</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{current.subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="relative hidden w-[300px] max-w-[40vw] lg:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search issues, workers..."
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] pl-9 pr-3 text-sm text-zinc-700 outline-none ring-sky-400 transition focus:ring-2 dark:text-zinc-200"
            />
          </label>

          <ThemeToggle />

          <button
            type="button"
            className="relative rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-2.5 text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border border-[var(--surface)] bg-red-500" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] p-1 pr-2 text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-200 dark:hover:text-zinc-100"
              aria-label="Open profile menu"
              aria-expanded={profileOpen}
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-zinc-200 dark:bg-slate-700">
                <UserRound className="h-4 w-4" />
              </span>
              <ChevronDown className={`h-3.5 w-3.5 transition ${profileOpen ? "rotate-180" : ""}`} />
            </button>

            {profileOpen ? (
              <div className="absolute right-0 top-12 z-30 w-48 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-lg">
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">Authority Head</p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">Department Portal</p>
                </div>
                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  className="w-full rounded-md px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-[var(--surface-muted)] dark:text-zinc-200"
                >
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  className="w-full rounded-md px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-[var(--surface-muted)] dark:text-zinc-200"
                >
                  Settings
                </button>
                <button
                  type="button"
                  onClick={() => void logout()}
                  disabled={isLoggingOut}
                  className="w-full rounded-md px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300 dark:hover:bg-red-900/20"
                >
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
