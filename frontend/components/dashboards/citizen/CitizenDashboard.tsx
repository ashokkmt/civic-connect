"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocation } from "@/lib/location/context";
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

const VIEW_META: Record<CitizenView, { title: string; subtitle: string }> = {
  dashboard_overview: {
    title: "Dashboard Overview",
    subtitle: "Track your reports and monitor local issue progress.",
  },
  my_issues: {
    title: "My Issues",
    subtitle: "Review issues you reported or supported nearby.",
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
  const [activeView, setActiveView] = useState<CitizenView>("dashboard_overview");

  const [citizenIssues, setCitizenIssues] = useState<CitizenIssue[]>([]);
  const [citizenLoading, setCitizenLoading] = useState(false);
  const [citizenError, setCitizenError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const locationReady = useMemo(() => location && isValidLocation(location), [location]);

  useEffect(() => {
    const view = searchParams.get("view");
    if (
      view === "dashboard_overview" ||
      view === "my_issues" ||
      view === "community_issues" ||
      view === "report_issue" ||
      view === "profile_settings"
    ) {
      setActiveView(view);
    }
  }, [searchParams]);

  const setView = (view: CitizenView) => {
    setActiveView(view);
    router.replace(`/dashboard/citizen?view=${view}`);
  };

  useEffect(() => {
    if (!locationReady || typeof lat !== "number" || typeof lng !== "number") {
      return;
    }

    const loadCitizenIssues = async () => {
      setCitizenLoading(true);
      setCitizenError(null);

      try {
        const response = await fetch(
          `/api/citizen/issues?lat=${lat}&lng=${lng}&radiusMeters=${DEFAULT_RADIUS}&limit=${DEFAULT_LIMIT}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );
        const payload = (await response.json()) as IssuesResponse;

        if (!response.ok || !payload.success) {
          setCitizenError(payload.error?.message ?? "Unable to load citizen issues");
          setCitizenIssues([]);
          return;
        }

        setCitizenIssues(payload.data?.items ?? []);
      } catch {
        setCitizenError("Unable to load citizen issues");
      } finally {
        setCitizenLoading(false);
      }
    };

    loadCitizenIssues();
  }, [lat, lng, locationReady, refreshNonce]);

  const myIssues = useMemo(
    () => citizenIssues.filter((issue) => Boolean(issue.isReporter || issue.isSupporter)),
    [citizenIssues]
  );

  const communityIssues = useMemo(() => citizenIssues, [citizenIssues]);

  const currentMeta = VIEW_META[activeView];

  return (
    <CitizenShell title={currentMeta.title} subtitle={currentMeta.subtitle} activeView={activeView}>
      {activeView === "dashboard_overview" ? (
        <DashboardOverview
          issues={citizenIssues}
          loading={citizenLoading}
          error={citizenError}
          locationReady={Boolean(locationReady)}
          location={location}
          onQuickAction={(viewId) => setView(viewId)}
        />
      ) : null}

      {activeView === "my_issues" ? (
        <MyIssues
          issues={myIssues}
          loading={citizenLoading}
          error={citizenError}
          locationReady={Boolean(locationReady)}
        />
      ) : null}

      {activeView === "community_issues" ? (
        <CommunityIssues
          issues={communityIssues}
          loading={citizenLoading}
          error={citizenError}
          locationReady={Boolean(locationReady)}
        />
      ) : null}

      {activeView === "report_issue" ? (
        <ReportIssue
          onSuccessNavigate={(viewId) => setView(viewId)}
          onIssueReported={() => setRefreshNonce((prev) => prev + 1)}
        />
      ) : null}

      {activeView === "profile_settings" ? <ProfileSettings /> : null}
    </CitizenShell>
  );
}
