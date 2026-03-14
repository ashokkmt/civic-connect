"use client";

import type { LucideIcon } from "lucide-react";
import { ClipboardList, LayoutDashboard, Menu, Send, X } from "lucide-react";

export type WorkerView = "overview" | "assigned_issues" | "submit_resolution";

type WorkerNavItem = {
  id: WorkerView;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

type AuthorityWorkerSidebarProps = {
  activeView: WorkerView;
  onSelect: (view: WorkerView) => void;
  mobileOpen: boolean;
  onOpenMobile: () => void;
  onCloseMobile: () => void;
  totalAssigned: number;
  inProgressCount: number;
};

function SidebarContent({
  activeView,
  onSelect,
  totalAssigned,
  inProgressCount,
}: Pick<AuthorityWorkerSidebarProps, "activeView" | "onSelect" | "totalAssigned" | "inProgressCount">) {
  const items: WorkerNavItem[] = [
    { id: "overview", label: "Worker Dashboard", icon: LayoutDashboard },
    { id: "assigned_issues", label: "Assigned Issues", icon: ClipboardList, badge: `${totalAssigned}` },
    { id: "submit_resolution", label: "Submit Resolution", icon: Send, badge: `${inProgressCount}` },
  ];

  return (
    <aside className="flex h-full w-full flex-col border-r border-[var(--border)] bg-[var(--surface)] px-5 py-6">
      <div className="flex items-center gap-3 px-1">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600 text-sm font-black text-white shadow-md">
          CC
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">CivicConnect</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Authority Worker</p>
        </div>
      </div>

      <nav className="mt-9 space-y-1.5">
        {items.map((item) => {
          const active = activeView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                active
                  ? "bg-sky-100/80 text-sky-700 dark:bg-sky-900/35 dark:text-sky-200"
                  : "text-zinc-600 hover:bg-[var(--surface-muted)] hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span className="inline-flex items-center gap-3">
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
              {item.badge ? (
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:text-zinc-300">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Shift Pulse</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">On duty</p>
        </div>
        <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-300">Use quick actions to move tasks from ASSIGNED to IN_PROGRESS and RESOLVED.</p>
      </div>
    </aside>
  );
}

export function AuthorityWorkerSidebar({
  activeView,
  onSelect,
  mobileOpen,
  onOpenMobile,
  onCloseMobile,
  totalAssigned,
  inProgressCount,
}: AuthorityWorkerSidebarProps) {
  return (
    <>
      <div className="mb-4 lg:hidden">
        <button
          type="button"
          onClick={onOpenMobile}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm dark:text-zinc-200"
        >
          <Menu className="h-4 w-4" />
          Worker menu
        </button>
      </div>

      <div className="hidden w-80 shrink-0 lg:sticky lg:top-0 lg:block lg:h-screen">
        <SidebarContent
          activeView={activeView}
          onSelect={onSelect}
          totalAssigned={totalAssigned}
          inProgressCount={inProgressCount}
        />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close worker menu" className="absolute inset-0 bg-black/40" onClick={onCloseMobile} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw]">
            <div className="absolute right-3 top-3 z-10">
              <button
                type="button"
                aria-label="Close menu"
                onClick={onCloseMobile}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 text-zinc-600 shadow-sm dark:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarContent
              activeView={activeView}
              totalAssigned={totalAssigned}
              inProgressCount={inProgressCount}
              onSelect={(view) => {
                onSelect(view);
                onCloseMobile();
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
