"use client";

import type { LucideIcon } from "lucide-react";
import { Menu, X } from "lucide-react";

type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

type SidebarProps = {
  items: NavItem[];
  activeView: string;
  onSelect: (viewId: string) => void;
  mobileOpen: boolean;
  onOpenMobile: () => void;
  onCloseMobile: () => void;
};

function SidebarContent({ items, activeView, onSelect }: Pick<SidebarProps, "items" | "activeView" | "onSelect">) {
  return (
    <aside className="flex h-full w-full flex-col border-r border-[var(--border)] bg-[var(--surface)] px-5 py-6">
      <div className="flex items-center gap-3 px-2">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-blue-600 text-base font-bold text-white shadow-sm">
          CC
        </div>
        <div>
          <p className="text-xl leading-none font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">CivicConnect</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Citizen portal</p>
        </div>
      </div>

      <nav className="mt-10 space-y-1.5">
        {items.map((item) => {
          const active = activeView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`group relative flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-base font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 ${
                active
                  ? "bg-sky-100/80 text-sky-700 shadow-sm dark:bg-sky-900/40 dark:text-sky-200"
                  : "text-zinc-600 hover:bg-[var(--surface-muted)] hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={`absolute left-2 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full transition ${
                  active ? "bg-sky-500" : "bg-transparent group-hover:bg-zinc-300 dark:group-hover:bg-zinc-600"
                }`}
              />
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Tip</p>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
          Keep your location updated to get accurate nearby issue data.
        </p>
      </div>
    </aside>
  );
}

export function Sidebar({ items, activeView, onSelect, mobileOpen, onOpenMobile, onCloseMobile }: SidebarProps) {
  return (
    <>
      <div className="mb-4 lg:hidden">
        <button
          type="button"
          onClick={onOpenMobile}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm dark:text-zinc-200"
        >
          <Menu className="h-4 w-4" />
          Menu
        </button>
      </div>

      <div className="hidden w-80 shrink-0 lg:sticky lg:top-0 lg:block lg:h-screen">
        <SidebarContent items={items} activeView={activeView} onSelect={onSelect} />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close citizen menu"
            className="absolute inset-0 bg-black/40"
            onClick={onCloseMobile}
          />
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
            <SidebarContent items={items} activeView={activeView} onSelect={(viewId) => {
              onSelect(viewId);
              onCloseMobile();
            }} />
          </div>
        </div>
      ) : null}
    </>
  );
}
