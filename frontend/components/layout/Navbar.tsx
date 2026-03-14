"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, Moon, Sun, User } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

type NavbarProps = {
  title: string;
  subtitle: string;
};

export function Navbar({ title, subtitle }: NavbarProps) {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!profileOpen) {
      return;
    }

    const onWindowClick = (event: MouseEvent) => {
      if (!menuRef.current) {
        return;
      }

      const target = event.target as Node;
      if (!menuRef.current.contains(target)) {
        setProfileOpen(false);
      }
    };

    window.addEventListener("click", onWindowClick);
    return () => window.removeEventListener("click", onWindowClick);
  }, [profileOpen]);

  const goToProfileSettings = () => {
    setProfileOpen(false);
    router.push("/dashboard/citizen?view=profile_settings");
  };

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } finally {
      setIsLoggingOut(false);
      setProfileOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/85 px-4 py-4 backdrop-blur-xl sm:px-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Citizen dashboard</p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{title}</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="relative rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-2.5 text-zinc-600 transition hover:-translate-y-0.5 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
          </button>
          <button
            type="button"
            onClick={toggle}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-2.5 text-zinc-600 transition hover:-translate-y-0.5 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5 text-xs font-medium text-zinc-700 transition hover:-translate-y-0.5 dark:text-zinc-200"
              aria-label="Profile menu"
              aria-expanded={profileOpen}
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
              <ChevronDown className={`h-3.5 w-3.5 transition ${profileOpen ? "rotate-180" : ""}`} />
            </button>

            {profileOpen ? (
              <div className="absolute right-0 mt-2 w-44 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-lg">
                <button
                  type="button"
                  onClick={goToProfileSettings}
                  className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-zinc-700 transition hover:bg-[var(--surface-muted)] dark:text-zinc-200"
                >
                  Profile settings
                </button>
                <button
                  type="button"
                  onClick={logout}
                  disabled={isLoggingOut}
                  className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300 dark:hover:bg-red-900/20"
                >
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
