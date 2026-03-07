"use client";

import { useState } from "react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

type DashboardShellProps = {
  children: React.ReactNode;
  role?: string;
  authoritySubRole?: string;
};

export function DashboardShell({ children, role, authoritySubRole }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex">
        <DashboardSidebar
          className="hidden lg:flex"
          role={role}
          authoritySubRole={authoritySubRole}
        />
        <div className="flex min-h-screen w-full flex-col">
          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
            <div className="mx-auto w-full max-w-6xl">
              <div className="mb-4 flex items-center lg:hidden">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-[var(--surface-muted)] dark:text-zinc-200"
                  aria-label="Open menu"
                >
                  Open menu
                </button>
              </div>
              {children}
            </div>
          </main>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu overlay"
          />
          <div className="absolute left-0 top-0 h-full w-72">
            <DashboardSidebar
              className="h-full w-full"
              onClose={() => setMobileOpen(false)}
              showClose
              role={role}
              authoritySubRole={authoritySubRole}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
