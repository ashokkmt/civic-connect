import Link from "next/link";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Badge, toneFromIssueStatus } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import type { CitizenIssue } from "@/components/dashboards/citizen/types";

type MyIssuesProps = {
  issues: CitizenIssue[];
  loading: boolean;
  error: string | null;
  locationReady: boolean;
};

export function MyIssues({ issues, loading, error, locationReady }: MyIssuesProps) {
  if (!locationReady) {
    return (
      <EmptyState
        title="Location required"
        description="Set your location on the public homepage to view your nearby issue list."
      />
    );
  }

  if (loading) {
    return <div className="h-56 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]" />;
  }

  if (error) {
    return <EmptyState title="Unable to load issues" description={error} />;
  }

  if (issues.length === 0) {
    return <EmptyState title="No issues found" description="You have not reported or supported any nearby issues yet." />;
  }

  return (
    <Table headers={["Issue", "Status", "Supporters", "Updated", "Action"]}>
      {issues.map((issue) => (
        <tr key={issue.id} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--surface-muted)]/70 last:border-b-0">
          <td className="px-4 py-3.5">
            <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">{issue.title}</p>
            {issue.departmentId ? (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Department: {issue.departmentId}</p>
            ) : null}
          </td>
          <td className="px-4 py-3.5">
            <Badge tone={toneFromIssueStatus(issue.status)}>{issue.status}</Badge>
          </td>
          <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-300">{issue.supporterCount ?? 0}</td>
          <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-300">
            {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : "-"}
          </td>
          <td className="px-4 py-3.5">
            <Link
              href={`/dashboard/citizen/issues/${issue.id}`}
              className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:border-sky-300 hover:text-sky-600 dark:bg-[var(--surface-muted)] dark:text-sky-300"
            >
              View detail
            </Link>
          </td>
        </tr>
      ))}
    </Table>
  );
}
