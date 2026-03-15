import dynamic from "next/dynamic";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ClipboardList, MapPin, Timer } from "lucide-react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Badge, toneFromIssueStatus } from "@/components/ui/Badge";
import type { CitizenIssue } from "@/components/dashboards/citizen/types";
import type { Location } from "@/lib/location/types";

const LocationMapPicker = dynamic(
  () => import("@/components/location/LocationMapPicker").then((module) => module.LocationMapPicker),
  { ssr: false }
);

type DashboardOverviewProps = {
  issues: CitizenIssue[];
  loading: boolean;
  error: string | null;
  locationReady: boolean;
  location: Location | null;
  onQuickAction: (viewId: "my_issues") => void;
};

function countByStatus(issues: CitizenIssue[], statuses: string[]) {
  return issues.filter((issue) => statuses.includes(issue.status)).length;
}

function formatStatusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export function DashboardOverview({
  issues,
  loading,
  error,
  locationReady,
  location,
  onQuickAction,
}: DashboardOverviewProps) {
  if (!locationReady) {
    return (
      <EmptyState
        title="Location required"
        description="Set your location on the public homepage before using the citizen dashboard."
      />
    );
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-28 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]" />
        ))}
      </div>
    );
  }

  if (error) {
    return <EmptyState title="Unable to load dashboard" description={error} />;
  }

  const total = issues.length;
  const inProgress = countByStatus(issues, ["ASSIGNED", "IN_PROGRESS"]);
  const resolved = countByStatus(issues, ["RESOLVED", "CLOSED", "AWAITING_HEAD_CLOSURE"]);
  const needsAttention = countByStatus(issues, ["REJECTED", "PENDING_APPROVAL"]);

  const stats = [
    {
      label: "Total reports",
      value: total,
      description: "Issues within your saved location",
      icon: ClipboardList,
      accent: "from-sky-500/10 to-cyan-400/20 text-sky-700 dark:text-sky-200",
    },
    {
      label: "In progress",
      value: inProgress,
      description: "Assigned and currently active",
      icon: Timer,
      accent: "from-amber-500/10 to-orange-400/20 text-amber-700 dark:text-amber-200",
    },
    {
      label: "Resolved",
      value: resolved,
      description: "Resolved or closed reports",
      icon: CheckCircle2,
      accent: "from-emerald-500/10 to-green-400/20 text-emerald-700 dark:text-emerald-200",
    },
    {
      label: "Needs attention",
      value: needsAttention,
      description: "Pending or rejected submissions",
      icon: AlertTriangle,
      accent: "from-rose-500/10 to-red-400/20 text-rose-700 dark:text-rose-200",
    },
  ];

  const recent = [...issues]
    .sort((a, b) => (new Date(b.createdAt ?? "").getTime() || 0) - (new Date(a.createdAt ?? "").getTime() || 0))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.label}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className={`inline-flex rounded-lg bg-gradient-to-br p-2.5 ${item.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  Live
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{item.value}</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
            </article>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[2fr_1fr]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h3 className="text-lg font-bold">Recent Activity</h3>
            <button
              type="button"
              onClick={() => onQuickAction("my_issues")}
              className="text-sm font-bold text-sky-700 hover:underline dark:text-sky-300"
            >
              View All
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recent.length === 0 ? (
              <div className="px-6 py-6 text-sm text-slate-500 dark:text-slate-400">No issue activity available yet.</div>
            ) : (
              recent.map((issue) => (
                <Link
                  key={issue.id}
                  href={`/dashboard/citizen/issues/${issue.id}`}
                  className="flex gap-4 px-6 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    <ClipboardList className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{issue.title}</p>
                      <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                        {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : "No date"}
                      </span>
                    </div>

                    <p className="line-clamp-1 text-sm text-slate-500 dark:text-slate-400">
                      {issue.description ?? "No description available."}
                    </p>

                    <div className="mt-3 flex items-center gap-3">
                      <Badge tone={toneFromIssueStatus(issue.status)} className="rounded text-[10px] font-bold uppercase tracking-wide">
                        {formatStatusLabel(issue.status)}
                      </Badge>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <MapPin className="h-3.5 w-3.5" />
                        Nearby area
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h3 className="text-lg font-bold">Area Map</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Showing active reports in your district</p>
          </div>

          <div className="p-4">
            <LocationMapPicker
              value={location}
              onPick={() => {}}
              interactive={false}
              mapHeightClassName="h-72"
              selectedZoom={15}
            />
            {location ? (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Centered at {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
