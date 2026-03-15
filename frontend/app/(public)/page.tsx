"use client";

import { useEffect, useMemo, useState } from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { MetricsSection } from "@/components/home/MetricsSection";
import { RecentIssuesSlider } from "@/components/home/RecentIssuesSlider";
import { HowItWorks } from "@/components/home/HowItWorks";
import { LocationSetupCard } from "@/components/location/LocationSetupCard";
import { useLocation } from "@/lib/location/context";
import { isValidLocation } from "@/lib/location/validation";

type IssuePublic = {
  id: string;
  title: string;
  description: string;
  status: string;
  supporterCount?: number;
  createdAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  category?: string;
  severity?: string;
  distanceMeters?: number;
};

type IssuesResponse = {
  success: boolean;
  data?: { items?: IssuePublic[] };
  error?: { message?: string };
};

type StatsResponse = {
  success: boolean;
  data?: {
    total: number;
    pendingApprovals: number;
    inProgress: number;
    resolved: number;
  };
  error?: { message?: string };
};

const DEFAULT_RADIUS = 2000;
const DEFAULT_LIMIT = 100;
const MAX_RESOLVED_MARQUEE = 12;

export default function HomePage() {
  const { location } = useLocation();
  const [issues, setIssues] = useState<IssuePublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locationReady = useMemo(() => location && isValidLocation(location), [location]);
  const [stats, setStats] = useState({ total: 0, pendingApprovals: 0, inProgress: 0, resolved: 0 });

  const resolvedIssues = useMemo(
    () => issues.filter((issue) => ["RESOLVED", "CLOSED"].includes(issue.status)),
    [issues]
  );

  const recentIssues = useMemo(() => {
    const items = resolvedIssues.length ? resolvedIssues : issues;
    return [...items]
      .sort((a, b) => {
        const aDate = a.resolvedAt ?? a.closedAt ?? a.createdAt ?? "";
        const bDate = b.resolvedAt ?? b.closedAt ?? b.createdAt ?? "";
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      })
      .slice(0, MAX_RESOLVED_MARQUEE);
  }, [issues, resolvedIssues]);

  const computeStatsFromIssues = (items: IssuePublic[]) => {
    const total = items.length;
    const pendingApprovals = items.filter((issue) => issue.status === "PENDING_APPROVAL").length;
    const inProgress = items.filter((issue) => issue.status === "IN_PROGRESS").length;
    const resolved = items.filter((issue) => ["RESOLVED", "CLOSED"].includes(issue.status)).length;

    return { total, pendingApprovals, inProgress, resolved };
  };

  const loadIssues = async (lat: number, lng: number, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const [issuesResponse, statsResponse] = await Promise.all([
        fetch(
          `/api/public/issues?lat=${lat}&lng=${lng}&radiusMeters=${DEFAULT_RADIUS}&limit=${DEFAULT_LIMIT}`,
          { method: "GET", signal }
        ),
        fetch(`/api/public/issues/stats?lat=${lat}&lng=${lng}&radiusMeters=${DEFAULT_RADIUS}`, {
          method: "GET",
          signal,
        }),
      ]);

      const issuesPayload = (await issuesResponse.json()) as IssuesResponse;
      if (!issuesResponse.ok || !issuesPayload.success) {
        setError(issuesPayload.error?.message ?? "Unable to load issues");
        setIssues([]);
        setStats({ total: 0, pendingApprovals: 0, inProgress: 0, resolved: 0 });
        return;
      }

      const items = issuesPayload.data?.items ?? [];
      setIssues(items);

      const statsPayload = (await statsResponse.json()) as StatsResponse;
      if (statsResponse.ok && statsPayload.success && statsPayload.data) {
        setStats(statsPayload.data);
      } else {
        setStats(computeStatsFromIssues(items));
      }
    } catch (err) {
      if ((err as DOMException).name === "AbortError") {
        return;
      }
      setError("Unable to load issues");
      setStats({ total: 0, pendingApprovals: 0, inProgress: 0, resolved: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!locationReady || !location) {
      return;
    }
    const controller = new AbortController();
    loadIssues(location.lat, location.lng, controller.signal);
    return () => controller.abort();
  }, [locationReady, location?.lat, location?.lng]);

  return (
    <div className="home-tone relative">
      <HeroSection />
      <div className="mx-auto w-full max-w-6xl px-6 py-4 lg:px-8">
        <LocationSetupCard
          title="Set your civic location"
          description="Use your device location first, or refine it using map click and optional place search."
        />
      </div>
      <MetricsSection stats={stats} locationReady={locationReady} loading={loading} error={error} />
      <RecentIssuesSlider
        issues={recentIssues}
        locationReady={locationReady}
        loading={loading}
        error={error}
      />
      <HowItWorks />
    </div>
  );
}
