import dynamic from "next/dynamic";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ClipboardList, Timer } from "lucide-react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Badge, toneFromIssueStatus } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
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
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.label} className="overflow-hidden">
              <CardBody>
                <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br p-2.5 ${item.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-xs uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400">{item.label}</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{item.value}</p>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{item.description}</p>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
        <Card>
          <CardHeader
            title="Recent activity"
            description="Latest reported and followed issues"
            action={<button type="button" onClick={() => onQuickAction("my_issues")} className="text-xs font-semibold text-sky-700 hover:underline dark:text-sky-300">View all</button>}
          />
          <CardBody className="space-y-3">
            {recent.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No issue activity available yet.</p>
            ) : (
              recent.map((issue) => (
                <Link
                  key={issue.id}
                  href={`/dashboard/citizen/issues/${issue.id}`}
                  className="flex items-start justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5 transition hover:border-sky-300"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{issue.title}</p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {issue.createdAt ? new Date(issue.createdAt).toLocaleString() : "No date"}
                    </p>
                  </div>
                  <Badge tone={toneFromIssueStatus(issue.status)}>{issue.status}</Badge>
                </Link>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Area map" description="Pinned to your selected location" />
          <CardBody className="space-y-2">
            <LocationMapPicker
              value={location}
              onPick={() => {}}
              interactive={false}
              mapHeightClassName="h-56"
              selectedZoom={15}
            />
            {location ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Centered at {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </p>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
