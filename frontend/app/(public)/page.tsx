"use client";

import { useEffect, useMemo, useState } from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { MetricsSection } from "@/components/home/MetricsSection";
import { RecentIssuesSlider } from "@/components/home/RecentIssuesSlider";
import { HowItWorks } from "@/components/home/HowItWorks";
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

const DEFAULT_RADIUS = 2000;
const DEFAULT_LIMIT = 100;
const MAX_RESOLVED_MARQUEE = 12;

export default function HomePage() {
  const { location } = useLocation();
  const [issues, setIssues] = useState<IssuePublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locationReady = useMemo(() => location && isValidLocation(location), [location]);
  const stats = useMemo(() => {
    const total = issues.length;
    const pendingApprovals = issues.filter((issue) => issue.status === "PENDING_APPROVAL").length;
    const inProgress = issues.filter((issue) => issue.status === "IN_PROGRESS").length;
    const resolved = issues.filter((issue) => ["RESOLVED", "CLOSED"].includes(issue.status)).length;

    return {
      total,
      pendingApprovals,
      inProgress,
      resolved,
    };
  }, [issues]);

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

  const loadIssues = async (lat: number, lng: number, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/public/issues?lat=${lat}&lng=${lng}&radiusMeters=${DEFAULT_RADIUS}&limit=${DEFAULT_LIMIT}`,
        { method: "GET", signal }
      );
      const payload = (await response.json()) as IssuesResponse;
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to load issues");
        setIssues([]);
        return;
      }
      setIssues(payload.data?.items ?? []);
    } catch (err) {
      if ((err as DOMException).name === "AbortError") {
        return;
      }
      setError("Unable to load issues");
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
    <div className="relative">
      <HeroSection />
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
