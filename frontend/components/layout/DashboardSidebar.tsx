"use client";

import Link from "next/link";

const navItems = [
  { label: "Overview", href: "/dashboard" },
  { label: "Citizen", href: "/dashboard/citizen" },
  { label: "Head", href: "/dashboard/head" },
  { label: "Worker", href: "/dashboard/worker" },
  { label: "Admin", href: "/dashboard/admin" },
];

type DashboardSidebarProps = {
  className?: string;
  onClose?: () => void;
  showClose?: boolean;
};

export function DashboardSidebar({ className, onClose, showClose }: DashboardSidebarProps) {
  return (
    <aside
      className={`flex h-screen w-64 flex-col border-r border-[var(--border)] bg-[var(--surface)] px-4 py-6 ${
        className ?? ""
      }`}
    >
      <div className="flex items-center gap-3 px-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 text-sm font-bold text-white shadow-sm">
          CC
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">CivicConnect</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Dashboard</p>
        </div>
      </div>

      {showClose ? (
        <button
          type="button"
          onClick={onClose}
          className="mt-4 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-[var(--surface-muted)] dark:text-zinc-200"
        >
          Close menu
        </button>
      ) : null}

      <nav className="mt-8 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-[var(--surface-muted)] hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
            onClick={onClose}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-xs text-zinc-600 dark:text-zinc-300">
        <p className="font-semibold text-zinc-800 dark:text-zinc-100">Status</p>
        <p className="mt-2">Phase 1 setup in progress.</p>
      </div>
    </aside>
  );
}
