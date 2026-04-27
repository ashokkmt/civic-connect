"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { useLocation } from "@/lib/location/context";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { isValidLocation } from "@/lib/location/validation";
import { CitizenShell, type CitizenView } from "@/components/dashboards/citizen/CitizenShell";
import { CommunityIssues } from "@/components/dashboards/citizen/CommunityIssues";
import { DashboardOverview } from "@/components/dashboards/citizen/DashboardOverview";
import { MyIssues } from "@/components/dashboards/citizen/MyIssues";
import { ProfileSettings } from "@/components/dashboards/citizen/ProfileSettings";
import { ReportIssue } from "@/components/dashboards/citizen/ReportIssue";
import type { CitizenIssue, IssuesResponse } from "@/components/dashboards/citizen/types";

const DEFAULT_RADIUS = 2000;
const DEFAULT_LIMIT = 30;

function parseCitizenView(view: string | null): CitizenView {
  if (
    view === "dashboard_overview" ||
    view === "my_issues" ||
    view === "community_issues" ||
    view === "report_issue" ||
    view === "profile_settings"
  ) {
    return view;
  }

  return "dashboard_overview";
}

async function fetchCitizenIssues([, lat, lng]: readonly [string, number, number]) {
  const response = await fetch(
    `/api/citizen/issues?lat=${lat}&lng=${lng}&radiusMeters=${DEFAULT_RADIUS}&limit=${DEFAULT_LIMIT}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const payload = (await response.json().catch(() => null)) as IssuesResponse | null;
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error?.message ?? "Unable to load citizen issues");
  }

  return payload.data?.items ?? [];
}

async function fetchMyIssues([, limit]: readonly [string, number]) {
  const response = await fetch(`/api/citizen/issues/mine?limit=${limit}`, {
    method: "GET",
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as IssuesResponse | null;
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error?.message ?? "Unable to load your issues");
  }

  return payload.data?.items ?? [];
}

const VIEW_META: Record<CitizenView, { title: string; subtitle: string }> = {
  dashboard_overview: {
    title: "Dashboard Overview",
    subtitle: "Track your reports and monitor local issue progress.",
  },
  my_issues: {
    title: "My Issues",
    subtitle: "Review issues you reported and track their status.",
  },
  community_issues: {
    title: "Community Issues",
    subtitle: "Browse neighborhood reports from other citizens.",
  },
  report_issue: {
    title: "Report Issue",
    subtitle: "Submit a new civic issue with location and evidence.",
  },
  profile_settings: {
    title: "Profile Settings",
    subtitle: "Manage your personal information and account security.",
  },
};

export function CitizenDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { location } = useLocation();
  const lat = location?.lat;
  const lng = location?.lng;
  const activeView = parseCitizenView(searchParams.get("view"));
  const [search, setSearch] = useState("");
  const previousView = useRef<CitizenView | null>(null);

  const debouncedSearch = useDebouncedValue(search, 350);
  const stableLat = typeof lat === "number" ? Number(lat.toFixed(3)) : null;
  const stableLng = typeof lng === "number" ? Number(lng.toFixed(3)) : null;

  const locationReady = useMemo(() => {
    if (typeof stableLat !== "number" || typeof stableLng !== "number") {
      return false;
    }

    return isValidLocation({ lat: stableLat, lng: stableLng });
  }, [stableLat, stableLng]);

  const citizenIssuesKey =
    locationReady && typeof stableLat === "number" && typeof stableLng === "number"
      ? (["citizen-issues", stableLat, stableLng] as const)
      : null;

  const {
    data: citizenIssues = [],
    error: citizenIssuesError,
    isLoading: citizenLoading,
    isValidating: citizenValidating,
    mutate: mutateCitizenIssues,
  } = useSWR<CitizenIssue[], Error>(citizenIssuesKey, fetchCitizenIssues, {
    dedupingInterval: 30_000,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
  });

  const {
    data: myIssues = [],
    error: myIssuesQueryError,
    isLoading: myIssuesLoading,
    isValidating: myIssuesValidating,
    mutate: mutateMyIssues,
  } = useSWR<CitizenIssue[], Error>(["citizen-my-issues", DEFAULT_LIMIT] as const, fetchMyIssues, {
    dedupingInterval: 30_000,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
  });

  const citizenError = citizenIssuesError?.message ?? null;
  const myIssuesError = myIssuesQueryError?.message ?? null;

  const setView = (view: CitizenView) => {
    router.replace(`/dashboard/citizen?view=${view}`);
  };

  const searchQuery = debouncedSearch.trim().toLowerCase();

  const filterIssuesBySearch = useCallback((items: CitizenIssue[]) => {
    if (!searchQuery) {
      return items;
    }

    return items.filter((issue) => {
      const haystack = `${issue.id} ${issue.title} ${issue.description ?? ""} ${issue.status} ${issue.departmentId ?? ""}`.toLowerCase();
      return haystack.includes(searchQuery);
    });
  }, [searchQuery]);

  const communityIssues = useMemo(() => filterIssuesBySearch(citizenIssues), [citizenIssues, filterIssuesBySearch]);
  const filteredMyIssues = useMemo(() => filterIssuesBySearch(myIssues), [myIssues, filterIssuesBySearch]);

  useEffect(() => {
    if (!previousView.current) {
      previousView.current = activeView;
      return;
    }

    if (previousView.current === activeView) {
      return;
    }

    previousView.current = activeView;

    const tasks: Array<Promise<unknown>> = [mutateMyIssues()];
    if (locationReady) {
      tasks.push(mutateCitizenIssues());
    }
    void Promise.all(tasks);
  }, [activeView, locationReady, mutateCitizenIssues, mutateMyIssues]);

  const currentMeta = VIEW_META[activeView];
  const isRefreshing = citizenLoading || myIssuesLoading || citizenValidating || myIssuesValidating;

  const refreshDashboard = async () => {
    const tasks: Array<Promise<unknown>> = [mutateMyIssues()];
    if (locationReady) {
      tasks.push(mutateCitizenIssues());
    }
    await Promise.all(tasks);
  };

  return (
    <CitizenShell
      title={currentMeta.title}
      subtitle={currentMeta.subtitle}
      activeView={activeView}
      searchValue={search}
      onSearchChange={setSearch}
      onRefresh={refreshDashboard}
      isRefreshing={isRefreshing}
    >
      {activeView === "dashboard_overview" ? (
        <DashboardOverview
          issues={communityIssues}
          loading={citizenLoading}
          error={citizenError}
          locationReady={Boolean(locationReady)}
          location={location}
          onQuickAction={(viewId) => setView(viewId)}
        />
      ) : null}

      {activeView === "my_issues" ? (
        <MyIssues
          issues={filteredMyIssues}
          loading={myIssuesLoading}
          error={myIssuesError}
          onIssueDeleted={() => {
            void refreshDashboard();
          }}
        />
      ) : null}

      {activeView === "community_issues" ? (
        <CommunityIssues
          issues={communityIssues}
          loading={citizenLoading}
          error={citizenError}
          locationReady={Boolean(locationReady)}
          onReportIssue={() => setView("report_issue")}
        />
      ) : null}

      {activeView === "report_issue" ? (
        <ReportIssue
          onSuccessNavigate={(viewId) => setView(viewId)}
          onIssueReported={() => {
            void refreshDashboard();
          }}
        />
      ) : null}

      {activeView === "profile_settings" ? <ProfileSettings /> : null}
    </CitizenShell>
  );
}
