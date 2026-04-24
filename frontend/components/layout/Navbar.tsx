"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, Search, UserRound } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

type NavbarProps = {
  title: string;
  subtitle?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  locationLabel?: string;
  locationTooltip?: string;
  onLocationClick?: () => void;
  profileName?: string;
  profileSubtitle?: string;
  onProfile?: () => void;
  onSettings?: () => void;
  onLogout?: () => Promise<void> | void;
  isLoggingOut?: boolean;
  onToggleMobileMenu?: () => void;
  mobileMenuButton?: React.ReactNode;
};

export function Navbar({
  title,
  subtitle,
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  locationLabel,
  locationTooltip,
  onLocationClick,
  profileName,
  profileSubtitle,
  onProfile,
  onSettings,
  onLogout,
  isLoggingOut = false,
  onToggleMobileMenu,
  mobileMenuButton,
}: NavbarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
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

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 md:px-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-4 md:gap-6">
          {mobileMenuButton ? (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="rounded-lg bg-slate-100 p-2 text-slate-600 md:hidden dark:bg-slate-800 dark:text-slate-300"
              aria-label="Open menu"
            >
              {mobileMenuButton}
            </button>
          ) : null}

          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold tracking-tight text-slate-900 md:text-xl dark:text-slate-100">{title}</h2>
            {subtitle ? <p className="hidden truncate text-xs text-slate-500 sm:block dark:text-slate-400">{subtitle}</p> : null}
          </div>
        </div>

        <div className="ml-3 flex items-center gap-3 md:gap-4">
          {locationLabel ? (
            <button
              type="button"
              onClick={onLocationClick}
              title={locationTooltip}
              className="hidden whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] shadow-sm transition hover:shadow md:inline-flex"
            >
              {locationLabel}
            </button>
          ) : null}

          <label className="relative hidden w-full max-w-md sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchValue ?? ""}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg bg-slate-100 py-2 pl-9 pr-4 text-sm text-slate-700 outline-none ring-sky-400 placeholder:text-slate-500 focus:ring-2 dark:bg-slate-800 dark:text-slate-200"
            />
          </label>

          <ThemeToggle />

          <button
            type="button"
            className="relative rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-white bg-red-500 dark:border-slate-900" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-1.5 py-1 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              aria-label="Open profile menu"
              aria-expanded={profileOpen}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
                <UserRound className="h-4 w-4" />
              </span>
              <ChevronDown className={`hidden h-3.5 w-3.5 transition sm:block ${profileOpen ? "rotate-180" : ""}`} />
            </button>

            {profileOpen ? (
              <div className="absolute right-0 top-12 z-30 w-44 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <div className="px-3 py-1.5">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{profileName ?? "User"}</p>
                  {profileSubtitle ? <p className="truncate text-xs text-slate-500 dark:text-slate-400">{profileSubtitle}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onProfile?.();
                    setProfileOpen(false);
                  }}
                  className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSettings?.();
                    setProfileOpen(false);
                  }}
                  className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Settings
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onLogout?.();
                    setProfileOpen(false);
                  }}
                  disabled={isLoggingOut}
                  className="w-full rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300 dark:hover:bg-red-900/20"
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
