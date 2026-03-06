"use client";

import { useEffect, useMemo, useState } from "react";
import { IssueCard } from "@/components/issues/IssueCard";
import { EmptyState } from "@/components/feedback/EmptyState";
import { LoadingSkeleton } from "@/components/feedback/LoadingSkeleton";
import { useLocation } from "@/lib/location/context";
import { isValidLocation } from "@/lib/location/validation";

type IssuePublic = {
  id: string;
  title: string;
  description: string;
  status: string;
  supporterCount?: number;
  createdAt?: string;
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

export default function IssuesPage() {
  const { location } = useLocation();
  const [issues, setIssues] = useState<IssuePublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [distanceFilter, setDistanceFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(6);

  const locationReady = useMemo(() => location && isValidLocation(location), [location]);
  const filteredIssues = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const now = Date.now();
    const dateWindowMs =
      dateFilter === "24h"
        ? 24 * 60 * 60 * 1000
        : dateFilter === "7d"
          ? 7 * 24 * 60 * 60 * 1000
          : dateFilter === "30d"
            ? 30 * 24 * 60 * 60 * 1000
            : null;

    return issues.filter((issue) => {
      if (normalizedQuery) {
        const haystack = `${issue.title} ${issue.description}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) {
          return false;
        }
      }

      if (statusFilter !== "all" && issue.status !== statusFilter) {
        return false;
      }

      if (categoryFilter !== "all" && issue.category && issue.category !== categoryFilter) {
        return false;
      }

      if (severityFilter !== "all" && issue.severity && issue.severity !== severityFilter) {
        return false;
      }

      if (distanceFilter !== "all" && typeof issue.distanceMeters === "number") {
        const maxDistance = Number(distanceFilter);
        if (!Number.isNaN(maxDistance) && issue.distanceMeters > maxDistance) {
          return false;
        }
      }

      if (dateWindowMs && issue.createdAt) {
        const createdAtMs = new Date(issue.createdAt).getTime();
        if (Number.isNaN(createdAtMs) || now - createdAtMs > dateWindowMs) {
          return false;
        }
      }

      return true;
    });
  }, [issues, query, statusFilter, categoryFilter, severityFilter, dateFilter, distanceFilter]);

  useEffect(() => {
    setVisibleCount(6);
  }, [query, statusFilter, categoryFilter, severityFilter, dateFilter, distanceFilter]);

  useEffect(() => {
    if (!locationReady) {
      return;
    }

    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/public/issues?lat=${location!.lat}&lng=${location!.lng}&radiusMeters=${DEFAULT_RADIUS}&limit=${DEFAULT_LIMIT}`,
          { method: "GET", signal: controller.signal }
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

    load();
    return () => controller.abort();
  }, [locationReady, location?.lat, location?.lng]);

  return (
    <section className="space-y-8 py-10">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Public issues</p>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">Community issue explorer</h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
          Filter and browse approved community issues near your saved location. Some filters apply only when the
          backend provides those fields.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 lg:sticky lg:top-24 lg:h-fit">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Search</p>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search issues"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Status</p>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200"
            >
              <option value="all">All statuses</option>
              <option value="PENDING_APPROVAL">Pending approval</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="AWAITING_HEAD_CLOSURE">Awaiting closure</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Category</p>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200"
            >
              <option value="all">All categories</option>
              <option value="Road">Road</option>
              <option value="Sanitation">Sanitation</option>
              <option value="Water">Water</option>
              <option value="Lighting">Lighting</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Severity</p>
            <select
              value={severityFilter}
              onChange={(event) => setSeverityFilter(event.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200"
            >
              <option value="all">All severities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Distance</p>
            <select
              value={distanceFilter}
              onChange={(event) => setDistanceFilter(event.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200"
            >
              <option value="all">Any distance</option>
              <option value="2000">Within 2 km</option>
              <option value="5000">Within 5 km</option>
              <option value="10000">Within 10 km</option>
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Date reported</p>
            <select
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200"
            >
              <option value="all">Any time</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setQuery("");
              setStatusFilter("all");
              setCategoryFilter("all");
              setSeverityFilter("all");
              setDistanceFilter("all");
              setDateFilter("all");
            }}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-[var(--surface-muted)] dark:text-zinc-200"
          >
            Reset filters
          </button>
        </aside>

        <section className="space-y-4">
          {!locationReady ? (
            <EmptyState
              title="Location required"
              description="Set your location on the home page to view nearby issues."
            />
          ) : loading ? (
            <LoadingSkeleton label="Loading nearby issues" />
          ) : error ? (
            <EmptyState title="Unable to load issues" description={error} />
          ) : filteredIssues.length === 0 ? (
            <EmptyState title="No matching issues" description="Try adjusting your filters." />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <span>Showing {Math.min(visibleCount, filteredIssues.length)} of {filteredIssues.length} issues</span>
                <span>Sorted by most recent report</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {filteredIssues
                  .sort((a, b) => {
                    const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return bDate - aDate;
                  })
                  .slice(0, visibleCount)
                  .map((issue) => (
                    <IssueCard key={issue.id} issue={issue} />
                  ))}
              </div>
              {visibleCount < filteredIssues.length ? (
                <button
                  type="button"
                  onClick={() => setVisibleCount((count) => count + 6)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-[var(--surface-muted)] dark:text-zinc-200"
                >
                  Load more issues
                </button>
              ) : null}
            </>
          )}
        </section>
      </div>
    </section>

  );
}
