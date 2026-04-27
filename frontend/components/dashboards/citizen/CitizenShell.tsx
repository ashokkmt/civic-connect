"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Home, LayoutList, Menu, PlusCircle, Settings } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { LocationModal } from "@/components/location/LocationModal";
import { useAuthSession } from "@/lib/auth/session-context";
import { useLocation } from "@/lib/location/context";
import { isValidLocation } from "@/lib/location/validation";

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
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onRefresh?: () => Promise<void> | void;
  isRefreshing?: boolean;
  children: React.ReactNode;
};

export function CitizenShell({
  title,
  subtitle,
  activeView,
  searchValue = "",
  onSearchChange,
  onRefresh,
  isRefreshing = false,
  children,
}: CitizenShellProps) {
  const router = useRouter();
  const { user, isLoading: sessionLoading, setCachedUser } = useAuthSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [lastSyncedLocation, setLastSyncedLocation] = useState<string | null>(null);
  const didBootstrapProfile = useRef(false);
  const { location, setLocation } = useLocation();
  const initialLocation = useRef(location);

  const profileName = user?.name ?? "Citizen User";
  const profileEmail = user?.email ?? "resident@civicconnect.local";
  const profileLoaded = !sessionLoading;

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
    if (didBootstrapProfile.current || sessionLoading) {
      return;
    }
    didBootstrapProfile.current = true;

    const profileLocation = user?.location;
    if (
      typeof profileLocation?.lat === "number" &&
      typeof profileLocation?.lng === "number" &&
      isValidLocation({ lat: profileLocation.lat, lng: profileLocation.lng })
    ) {
      setLocation({ lat: profileLocation.lat, lng: profileLocation.lng });
      setLastSyncedLocation(`${profileLocation.lat.toFixed(6)},${profileLocation.lng.toFixed(6)}`);
      return;
    }

    if (!initialLocation.current) {
      if (typeof window !== "undefined" && window.navigator.geolocation) {
        window.navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          },
          () => {
            // Keep location unset when permission is denied.
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      }
    }
  }, [sessionLoading, user?.location, user?.location?.lat, user?.location?.lng, setLocation]);

  useEffect(() => {
    if (!profileLoaded || !location || !isValidLocation(location)) {
      return;
    }

    const snapshot = `${location.lat.toFixed(6)},${location.lng.toFixed(6)}`;
    if (snapshot === lastSyncedLocation) {
      return;
    }

    const syncLocation = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ location: { lat: location.lat, lng: location.lng } }),
        });

        if (response.ok) {
          setLastSyncedLocation(snapshot);
          if (user) {
            setCachedUser({
              ...user,
              location: { lat: location.lat, lng: location.lng },
            });
          }
        }
      } catch {
        // Keep dashboard usable even when profile sync fails.
      }
    };

    void syncLocation();
  }, [location, profileLoaded, lastSyncedLocation, user, setCachedUser]);

  const locationLabel = location ? "Location" : "Set location";
  const locationTooltip = location
    ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
    : "Location is not set";

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
              searchValue={searchValue}
              onSearchChange={onSearchChange}
              locationLabel={locationLabel}
              locationTooltip={locationTooltip}
              onLocationClick={() => setLocationModalOpen(true)}
              onRefresh={onRefresh}
              isRefreshing={isRefreshing}
              refreshLabel="Refresh"
              profileName={profileName}
              profileSubtitle={profileEmail}
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

            <LocationModal open={locationModalOpen} onClose={() => setLocationModalOpen(false)} />
          </div>
        </div>
      </div>
    </div>
  );
}
