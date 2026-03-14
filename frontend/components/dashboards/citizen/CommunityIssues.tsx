import Link from "next/link";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Badge, toneFromIssueStatus } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import type { CitizenIssue } from "@/components/dashboards/citizen/types";

type CommunityIssuesProps = {
  issues: CitizenIssue[];
  loading: boolean;
  error: string | null;
  locationReady: boolean;
};

export function CommunityIssues({ issues, loading, error, locationReady }: CommunityIssuesProps) {
  if (!locationReady) {
    return (
      <EmptyState
        title="Location required"
        description="Set your location on the public homepage to view community issues near you."
      />
    );
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-40 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]" />
        ))}
      </div>
    );
  }

  if (error) {
    return <EmptyState title="Unable to load community issues" description={error} />;
  }

  if (issues.length === 0) {
    return <EmptyState title="No nearby issues" description="No public reports found for your saved location." />;
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {issues.map((issue) => (
        <Card key={issue.id} className="overflow-hidden border-zinc-200/90 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.55)] dark:border-zinc-800">
          <CardHeader
            title={issue.title}
            action={<Badge tone={toneFromIssueStatus(issue.status)}>{issue.status}</Badge>}
          />
          <CardBody>
            <p className="line-clamp-3 text-base text-zinc-600 dark:text-zinc-300">
              {issue.description ?? "No description available."}
            </p>
            <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>Supporters: {issue.supporterCount ?? 0}</span>
              <span>{issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : "-"}</span>
            </div>
            <div className="mt-4">
              <Link
                href={`/dashboard/citizen/issues/${issue.id}`}
                className="inline-flex rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 dark:border-sky-900/60 dark:bg-sky-900/30 dark:text-sky-200"
              >
                Open issue
              </Link>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
