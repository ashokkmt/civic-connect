"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { IssueTable } from "@/components/issues/IssueTable";
import { EmptyState } from "@/components/feedback/EmptyState";
import { LoadingSkeleton } from "@/components/feedback/LoadingSkeleton";
import { useLocation } from "@/lib/location/context";
import { isValidLocation } from "@/lib/location/validation";

type IssuePublic = {
  id: string;
  title: string;
  status: string;
  supporterCount?: number;
  createdAt?: string;
};

type IssuesResponse = {
  success: boolean;
  data?: { items?: IssuePublic[] };
  error?: { message?: string };
};

const DEFAULT_RADIUS = 2000;

export default function CitizenIssuesPage() {
  const { location } = useLocation();
  const [issues, setIssues] = useState<IssuePublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locationReady = useMemo(() => location && isValidLocation(location), [location]);

  useEffect(() => {
    if (!locationReady || !location) {
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/citizen/issues?lat=${location.lat}&lng=${location.lng}&radiusMeters=${DEFAULT_RADIUS}`,
          { method: "GET" }
        );
        const payload = (await response.json()) as IssuesResponse;
        if (!response.ok || !payload.success) {
          setError(payload.error?.message ?? "Unable to load issues");
          setIssues([]);
          return;
        }
        setIssues(payload.data?.items ?? []);
      } catch {
        setError("Unable to load issues");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [locationReady, location?.lat, location?.lng]);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Citizen</p>
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">My issues</h1>
          <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
            Track issues you have reported or supported near your saved location.
          </p>
        </div>
        <Link
          href="/dashboard/citizen/issues/create"
          className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
        >
          Report new issue
        </Link>
      </header>

      {!locationReady ? (
        <EmptyState
          title="Location required"
          description="Set your location on the public homepage to view citizen issues."
        />
      ) : loading ? (
        <LoadingSkeleton label="Loading your issues" />
      ) : error ? (
        <EmptyState title="Unable to load issues" description={error} />
      ) : (
        <IssueTable issues={issues} emptyMessage="No issues found for your location." />
      )}
    </section>
  );
}
