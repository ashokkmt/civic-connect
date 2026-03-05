"use client";

import { useState } from "react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex">
        <DashboardSidebar className="hidden lg:flex" />
        <div className="flex min-h-screen w-full flex-col">
          <DashboardTopbar onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
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
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
