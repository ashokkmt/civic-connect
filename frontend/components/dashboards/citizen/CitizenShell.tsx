"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  ClipboardList,
  Home,
  LayoutList,
  Menu,
  Moon,
  PlusCircle,
  Search,
  Settings,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

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

type SidebarItem = {
  id: CitizenView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

function CitizenSidebar({
  items,
  activeView,
  onSelect,
}: {
  items: SidebarItem[];
  activeView: CitizenView;
  onSelect: (view: CitizenView) => void;
}) {
  return (
    <div className="flex h-full w-full flex-col bg-white dark:bg-slate-900">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-600 text-white">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight text-slate-900 dark:text-slate-100">CivicConnect</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Citizen Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                active
                  ? "bg-sky-100 font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"
                  : "font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto p-4">
        <div className="rounded-xl bg-sky-50 p-4 dark:bg-sky-900/20">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">Help Center</p>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">Need assistance with your report?</p>
          <button
            type="button"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}

export function CitizenShell({ title, subtitle, activeView, children }: CitizenShellProps) {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [name, setName] = useState("Citizen User");
  const [email, setEmail] = useState("resident@civicconnect.local");
  const [search, setSearch] = useState("");

  const sidebarItems = useMemo<SidebarItem[]>(
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

    loadProfile();
  }, []);

  const handleSelect = (viewId: CitizenView) => {
    router.push(`/dashboard/citizen?view=${viewId}`);
    setMobileOpen(false);
    setProfileMenuOpen(false);
  };

  const logout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } finally {
      setLoggingOut(false);
      setProfileMenuOpen(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex h-screen overflow-hidden">
        <aside className="hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white md:fixed md:inset-y-0 md:left-0 md:block dark:border-slate-800 dark:bg-slate-900">
          <CitizenSidebar items={sidebarItems} activeView={activeView} onSelect={handleSelect} />
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-3 rounded-md border border-slate-200 p-1 text-slate-500 dark:border-slate-700 dark:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
              <CitizenSidebar items={sidebarItems} activeView={activeView} onSelect={handleSelect} />
            </aside>
          </div>
        ) : null}

        <div className="min-w-0 flex-1 md:ml-64">
          <div className="flex h-screen flex-col overflow-hidden">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex min-w-0 flex-1 items-center gap-4 md:gap-6">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg bg-slate-100 p-2 text-slate-600 md:hidden dark:bg-slate-800 dark:text-slate-300"
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </button>

              <h2 className="truncate text-lg font-bold tracking-tight md:text-xl">{title}</h2>

              <div className="relative hidden w-full max-w-md sm:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search for reports or addresses..."
                  className="w-full rounded-lg bg-slate-100 py-2 pl-9 pr-4 text-sm text-slate-700 outline-none ring-sky-400 placeholder:text-slate-500 focus:ring-2 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="ml-3 flex items-center gap-3 md:gap-4">
              <button
                type="button"
                aria-label="Toggle theme"
                onClick={toggle}
                className="rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              <button
                type="button"
                aria-label="Notifications"
                className="relative rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-white bg-red-500 dark:border-slate-900" />
              </button>

              <div className="hidden h-7 w-px bg-slate-200 md:block dark:bg-slate-700" />

              <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-bold leading-none text-slate-900 dark:text-slate-100">{name}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{email}</p>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((open) => !open)}
                    className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-1.5 py-1 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    aria-label="Open profile menu"
                    aria-expanded={profileMenuOpen}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
                      <UserRound className="h-4 w-4" />
                    </span>
                    <ChevronDown className="hidden h-3.5 w-3.5 sm:block" />
                  </button>

                  {profileMenuOpen ? (
                    <div className="absolute right-0 top-12 z-30 w-44 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                      <button
                        type="button"
                        onClick={() => handleSelect("profile_settings")}
                        className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Profile Settings
                      </button>
                      <button
                        type="button"
                        onClick={logout}
                        disabled={loggingOut}
                        className="w-full rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300 dark:hover:bg-red-900/20"
                      >
                        {loggingOut ? "Logging out..." : "Logout"}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="space-y-2 p-4 md:p-8">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
              </div>
              {children}
            </div>
          </main>
          </div>
        </div>
      </div>
    </div>
  );
}
