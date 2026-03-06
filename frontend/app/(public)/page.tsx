"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/feedback/EmptyState";
import { LoadingSkeleton } from "@/components/feedback/LoadingSkeleton";
import { StatusBadge } from "@/components/issues/StatusBadge";
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
  const { location, setLocation, clearLocation } = useLocation();
  const [issues, setIssues] = useState<IssuePublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");

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

  const marqueeIssues = useMemo(() => resolvedIssues.slice(0, MAX_RESOLVED_MARQUEE), [resolvedIssues]);

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

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = { lat: position.coords.latitude, lng: position.coords.longitude };
        setLocation(next);
      },
      () => setError("Unable to fetch your location"),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  const submitManualLocation = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const lat = Number(latInput);
    const lng = Number(lngInput);
    const success = setLocation({ lat, lng });
    if (!success) {
      setError("Enter valid latitude and longitude values");
    }
  };

  const resetLocation = () => {
    clearLocation();
    setLatInput("");
    setLngInput("");
    setError(null);
  };

  return (
    <div className="min-h-screen
      bg-[radial-gradient(#d4d4d4_0.8px,transparent_0.8px)]
      bg-[size:24px_24px]
      bg-[#f8f8f6]
      dark:bg-[radial-gradient(#2a2a2a_0.8px,transparent_0.8px)]
      dark:bg-[size:24px_24px]
      dark:bg-[#0f0f0f]">

      <section className="py-10 lg:py-24 w-[60%] mx-auto h-[70vh]">
        <div className="h-full flex flex-col justify-center items-center">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">CivicConnect</p>
            <h1 className="text-4xl font-semibold text-zinc-900 dark:text-white sm:text-5xl">
              Track and resolve issues in your neighborhood
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Public transparency for local infrastructure. Follow what is reported, what is in motion, and
              what is already resolved.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/issues"
                className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
              >
                Explore issues near you
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-[var(--surface-muted)] dark:text-zinc-200"
              >
                Report an issue
              </Link>
            </div>
          </div>
          {/* <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm w-[70%]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Location</p>
                <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">
                  {locationReady ? "Location saved" : "Set your location"}
                </h2>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {locationReady
                    ? `${location?.lat.toFixed(3)}, ${location?.lng.toFixed(3)}`
                    : "Set a location to view live platform activity."}
                </p>
              </div>
              {locationReady ? (
                <button
                  type="button"
                  onClick={resetLocation}
                  className="rounded-full border border-[var(--border)] px-3 py-1 text-[11px] font-semibold text-zinc-600 transition hover:bg-[var(--surface-muted)] dark:text-zinc-200"
                >
                  Reset
                </button>
              ) : null}
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={requestGeolocation}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
              >
                Use my location
              </button>
              <form onSubmit={submitManualLocation} className="grid grid-cols-2 gap-3">
                <input
                  value={latInput}
                  onChange={(event) => setLatInput(event.target.value)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-zinc-700 dark:text-zinc-200"
                  placeholder="Latitude"
                />
                <input
                  value={lngInput}
                  onChange={(event) => setLngInput(event.target.value)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-zinc-700 dark:text-zinc-200"
                  placeholder="Longitude"
                />
                <button
                  type="submit"
                  className="col-span-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-[var(--surface-muted)] dark:text-zinc-200"
                >
                  Save manual location
                </button>
              </form>
            </div>
          </div> */}
        </div>
      </section>

      <section className="w-[85%] border border-[var(--border)] mx-auto"></section>

      <section className="py-10 lg:py-24 w-[60%] mx-auto h-[75vh]">
        <div className="h-full flex flex-col justify-center space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Platform statistics</p>
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Live public system metrics</h2>
            <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
              Updated from approved public issues near your saved location.
            </p>
          </div>

          {!locationReady ? (
            <EmptyState
              title="Set a location to see live stats"
              description="Use the location panel above to power the transparency overview."
            />
          ) : loading ? (
            <LoadingSkeleton label="Loading platform stats" />
          ) : error ? (
            <EmptyState title="Unable to load stats" description={error} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Total reported</p>
                <p className="mt-3 text-3xl font-semibold text-zinc-900 dark:text-white">{stats.total}</p>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Approved issues surfaced publicly.</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Pending review</p>
                <p className="mt-3 text-3xl font-semibold text-zinc-900 dark:text-white">{stats.pendingApprovals}</p>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Awaiting authority approval.</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">In progress</p>
                <p className="mt-3 text-3xl font-semibold text-zinc-900 dark:text-white">{stats.inProgress}</p>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Teams actively working.</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Resolved</p>
                <p className="mt-3 text-3xl font-semibold text-zinc-900 dark:text-white">{stats.resolved}</p>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Completed by city workers.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="w-[85%] border border-[var(--border)] mx-auto"></section>

      <section className="py-10 lg:py-24 w-[60%] mx-auto h-[75vh]">
        <div className="h-full flex flex-col justify-center space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Resolved activity</p>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
                Recently resolved issues
              </h2>
            </div>
            <Link
              href="/issues"
              className="text-xs font-semibold text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
            >
              Browse all activity →
            </Link>
          </div>

          {!locationReady ? (
            <EmptyState
              title="Set a location to see resolved activity"
              description="Use the location panel above to power the activity feed."
            />
          ) : loading ? (
            <LoadingSkeleton label="Loading resolved issues" />
          ) : error ? (
            <EmptyState title="Unable to load resolved issues" description={error} />
          ) : resolvedIssues.length === 0 ? (
            <EmptyState title="No resolved issues yet" description="Resolved issues will appear here once available." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-6">
              <div className="flex w-max gap-4 animate-marquee hover:[animation-play-state:paused]">
                {[...marqueeIssues, ...marqueeIssues].map((issue, index) => {
                  const resolvedAt = issue.resolvedAt ?? issue.closedAt ?? issue.createdAt;
                  return (
                    <div
                      key={`${issue.id}-${index}`}
                      className="min-w-[260px] rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white line-clamp-2">
                          {issue.title}
                        </p>
                        <StatusBadge status={issue.status} />
                      </div>
                      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Near your saved area</p>
                      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                        {resolvedAt ? `Resolved: ${new Date(resolvedAt).toLocaleDateString()}` : "Resolution time pending"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="w-[85%] border border-[var(--border)] mx-auto"></section>

      <section className="py-10 lg:py-24 w-[60%] mx-auto h-[75vh]">
        <div className="h-full flex flex-col justify-center space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">How it works</p>
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Issue lifecycle</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[
              { title: "Citizen reports issue", detail: "Residents submit issues with context.", icon: "📝" },
              { title: "Authority reviews", detail: "Officials approve and prioritize.", icon: "🛡️" },
              { title: "Worker assigned", detail: "Teams are dispatched to the site.", icon: "🧑‍🔧" },
              { title: "Work in progress", detail: "Fixes are tracked transparently.", icon: "🚧" },
              { title: "Issue resolved", detail: "Completed work is published.", icon: "✅" },
            ].map((step) => (
              <div
                key={step.title}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
              >
                <div className="text-2xl">{step.icon}</div>
                <h3 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-white">{step.title}</h3>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-[85%] border border-[var(--border)] mx-auto"></section>

      <section className="py-10 lg:py-24 w-[60%] mx-auto">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8 h-[60%] flex flex-col justify-center">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Get involved</p>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
                Report an issue in your area and help improve your community.
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Join the public record of local fixes and ensure every report is tracked to resolution.
              </p>
            </div>
            <Link
              href="/register"
              className="rounded-full bg-zinc-900 px-5 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
            >
              Report issue
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
