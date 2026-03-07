"use client";

import Link from "next/link";

type NavItem = {
  label: string;
  href: string;
};

type DashboardSidebarProps = {
  className?: string;
  onClose?: () => void;
  showClose?: boolean;
  role?: string;
  authoritySubRole?: string;
};

const navForRole = (role?: string, authoritySubRole?: string): NavItem[] => {
  if (role === "CITIZEN") {
    return [
      { label: "Overview", href: "/dashboard/citizen" },
      { label: "My Issues", href: "/dashboard/citizen/issues" },
      { label: "Report Issue", href: "/dashboard/citizen/issues/create" },
      { label: "Settings", href: "/dashboard/citizen/settings" },
    ];
  }

  if (role === "AUTHORITY" && authoritySubRole === "HEAD") {
    return [
      { label: "Overview", href: "/dashboard/head" },
      { label: "Pending Issues", href: "/dashboard/head/pending" },
      { label: "Create Worker", href: "/dashboard/head/workers" },
      { label: "Close Issue", href: "/dashboard/head/close" },
      { label: "Settings", href: "/dashboard/head/settings" },
    ];
  }

  if (role === "AUTHORITY" && authoritySubRole === "WORKER") {
    return [
      { label: "Overview", href: "/dashboard/worker" },
      { label: "Assigned Issues", href: "/dashboard/worker/issues" },
      { label: "Settings", href: "/dashboard/worker/settings" },
    ];
  }

  if (role === "ADMIN") {
    return [
      { label: "Overview", href: "/dashboard/admin" },
      { label: "Departments", href: "/dashboard/admin/departments" },
      { label: "Authority Heads", href: "/dashboard/admin/authorities" },
      { label: "Settings", href: "/dashboard/admin/settings" },
    ];
  }

  return [{ label: "Overview", href: "/dashboard" }];
};

export function DashboardSidebar({
  className,
  onClose,
  showClose,
  role,
  authoritySubRole,
}: DashboardSidebarProps) {
  const navItems = navForRole(role, authoritySubRole);
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
        <p className="font-semibold text-zinc-800 dark:text-zinc-100">Account</p>
        <p className="mt-2">Manage settings and logout from your role workspace.</p>
      </div>
    </aside>
  );
}
