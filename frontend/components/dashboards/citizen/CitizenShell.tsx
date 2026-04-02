"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Home, LayoutList, Menu, PlusCircle, Settings } from "lucide-react";
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

type MeResponse = {
  success: boolean;
  data?: {
    user?: {
      name?: string;
      email?: string;
    };
  };
};

export function CitizenShell({ title, subtitle, activeView, children }: CitizenShellProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [name, setName] = useState("Citizen User");
  const [email, setEmail] = useState("resident@civicconnect.local");
  const [search, setSearch] = useState("");

  const sidebarItems = useMemo(
    () => [
      { id: "dashboard_overview", label: "Dashboard", icon: Home },
      { id: "report_issue", label: "Report Issue", icon: PlusCircle },
      { id: "my_issues", label: "My Issues", icon: LayoutList },
      { id: "community_issues", label: "Community Issues", icon: ClipboardList },
      { id: "profile_settings", label: "Profile Settings", icon: Settings },
    ],
    []
  );

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/auth/me", { method: "GET" });
        const payload = (await response.json()) as MeResponse;
        if (!response.ok || !payload.success) {
          return;
        }

        const user = payload.data?.user;
        if (user?.name) {
          setName(user.name);
        }
        if (user?.email) {
          setEmail(user.email);
        }
      } catch {
        // Keep dashboard usable even if profile fetch fails.
      }
    };

    void loadProfile();
  }, []);

  const handleSelect = (viewId: CitizenView) => {
    router.push(`/dashboard/citizen?view=${viewId}`);
    setMobileOpen(false);
  };

  const logout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          items={sidebarItems}
          activeView={activeView}
          onSelect={(view) => handleSelect(view as CitizenView)}
          mobileOpen={mobileOpen}
          onOpenMobile={() => setMobileOpen(true)}
          onCloseMobile={() => setMobileOpen(false)}
          portalLabel="Citizen Portal"
          helpTitle="Help Center"
          helpDescription="Need assistance with your report?"
          helpButtonLabel="Contact Support"
          showMobileTrigger={false}
        />

        <div className="min-w-0 flex-1">
          <div className="flex h-screen flex-col overflow-hidden">
            <Navbar
              title={title}
              subtitle={subtitle}
              searchPlaceholder="Search for reports or addresses..."
              searchValue={search}
              onSearchChange={setSearch}
              profileName={name}
              profileSubtitle={email}
              onProfile={() => handleSelect("profile_settings")}
              onSettings={() => handleSelect("profile_settings")}
              onLogout={logout}
              isLoggingOut={loggingOut}
              onToggleMobileMenu={() => setMobileOpen(true)}
              mobileMenuButton={<Menu className="h-4 w-4" />}
            />

            <main className="flex-1 overflow-y-auto">
              <div className="space-y-2 p-4 md:p-8">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
