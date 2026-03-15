"use client";

import type { LucideIcon } from "lucide-react";
import { Home, Menu, X } from "lucide-react";

type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

type SidebarProps = {
  items: NavItem[];
  activeView: string;
  onSelect: (viewId: string) => void;
  mobileOpen: boolean;
  onOpenMobile: () => void;
  onCloseMobile: () => void;
  portalLabel?: string;
  helpTitle?: string;
  helpDescription?: string;
  helpButtonLabel?: string;
  showMobileTrigger?: boolean;
};

function SidebarContent({
  items,
  activeView,
  onSelect,
  portalLabel,
  helpTitle,
  helpDescription,
  helpButtonLabel,
}: Pick<
  SidebarProps,
  "items" | "activeView" | "onSelect" | "portalLabel" | "helpTitle" | "helpDescription" | "helpButtonLabel"
>) {
  return (
    <aside className="flex h-full w-full flex-col bg-white dark:bg-slate-900">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-600 text-white">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight text-slate-900 dark:text-slate-100">CivicConnect</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{portalLabel ?? "Dashboard"}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {items.map((item) => {
          const active = activeView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                active
                  ? "bg-sky-100 font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"
                  : "font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span className="inline-flex items-center gap-3">
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </span>
              {item.badge ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    active ? "bg-sky-200 text-sky-800 dark:bg-sky-800 dark:text-sky-100" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto p-4">
        <div className="rounded-xl bg-sky-50 p-4 dark:bg-sky-900/20">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
            {helpTitle ?? "Help Center"}
          </p>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{helpDescription ?? "Need assistance?"}</p>
          <button
            type="button"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {helpButtonLabel ?? "Contact Support"}
          </button>
        </div>
      </div>
    </aside>
  );
}

export function Sidebar({
  items,
  activeView,
  onSelect,
  mobileOpen,
  onOpenMobile,
  onCloseMobile,
  portalLabel,
  helpTitle,
  helpDescription,
  helpButtonLabel,
  showMobileTrigger = true,
}: SidebarProps) {
  return (
    <>
      {showMobileTrigger ? (
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
      ) : null}

      <div className="hidden w-64 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-0 lg:block lg:h-screen">
        <SidebarContent
          items={items}
          activeView={activeView}
          onSelect={onSelect}
          portalLabel={portalLabel}
          helpTitle={helpTitle}
          helpDescription={helpDescription}
          helpButtonLabel={helpButtonLabel}
        />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close citizen menu"
            className="absolute inset-0 bg-black/40"
            onClick={onCloseMobile}
          />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[85vw] border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="absolute right-3 top-3 z-10">
              <button
                type="button"
                aria-label="Close menu"
                onClick={onCloseMobile}
                className="rounded-md border border-slate-200 p-1 text-slate-500 dark:border-slate-700 dark:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarContent
              items={items}
              activeView={activeView}
              onSelect={(viewId) => {
                onSelect(viewId);
                onCloseMobile();
              }}
              portalLabel={portalLabel}
              helpTitle={helpTitle}
              helpDescription={helpDescription}
              helpButtonLabel={helpButtonLabel}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
