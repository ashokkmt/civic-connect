"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, CircleUserRound, Home, LayoutList, PlusCircle } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

export type CitizenView =
  | "dashboard_overview"
  | "my_issues"
  | "community_issues"
  | "report_issue"
  | "profile_settings";

type CitizenShellProps = {
  title: string;
  subtitle: string;
  activeView: CitizenView;
  children: React.ReactNode;
};

export function CitizenShell({ title, subtitle, activeView, children }: CitizenShellProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarItems = useMemo(
    () => [
      { id: "dashboard_overview", label: "Dashboard Overview", icon: Home },
      { id: "my_issues", label: "My Issues", icon: LayoutList },
      { id: "community_issues", label: "Community Issues", icon: ClipboardList },
      { id: "report_issue", label: "Report Issue", icon: PlusCircle },
      { id: "profile_settings", label: "Profile Settings", icon: CircleUserRound },
    ],
    []
  );

  const handleSelect = (viewId: string) => {
    router.push(`/dashboard/citizen?view=${viewId}`);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(56,189,248,0.09),transparent_45%),radial-gradient(circle_at_85%_25%,rgba(59,130,246,0.08),transparent_40%)]" />
      <div className="flex min-h-screen">
        <Sidebar
          items={sidebarItems}
          activeView={activeView}
          onSelect={handleSelect}
          mobileOpen={mobileOpen}
          onOpenMobile={() => setMobileOpen(true)}
          onCloseMobile={() => setMobileOpen(false)}
        />

        <div className="min-w-0 flex-1">
          <Navbar title={title} subtitle={subtitle} />
          <main className="px-4 py-6 sm:px-6 sm:py-8">
            <div className="mx-auto w-full max-w-[1200px] transition-all duration-200">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
