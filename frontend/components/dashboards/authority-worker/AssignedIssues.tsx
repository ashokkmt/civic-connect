import { EmptyState } from "@/components/feedback/EmptyState";
import { LoadingSkeleton } from "@/components/feedback/LoadingSkeleton";
import { FormError } from "@/components/forms/FormError";
import { StatusBadge } from "@/components/issues/StatusBadge";
import { Table } from "@/components/ui/Table";
import type { WorkerIssue } from "@/components/dashboards/authority-worker/types";

type AssignedIssuesProps = {
  issues: WorkerIssue[];
  loading: boolean;
  error: string | null;
  requestId: string | null;
  actionLoadingId: string | null;
  onStart: (issueId: string) => Promise<void>;
  onOpenResolution: (issueId: string) => void;
};

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function AssignedIssues({
  issues,
  loading,
  error,
  requestId,
  actionLoadingId,
  onStart,
  onOpenResolution,
}: AssignedIssuesProps) {
  const visible = issues.filter((issue) => issue.status === "ASSIGNED" || issue.status === "IN_PROGRESS");

  if (loading) {
    return <LoadingSkeleton label="Loading assigned issues" />;
  }

  return (
    <section className="space-y-4">
      <FormError message={error} />
      {requestId ? <p className="text-xs text-zinc-500 dark:text-zinc-400">Request ID: {requestId}</p> : null}

      {visible.length === 0 ? (
        <EmptyState title="No assigned issues" description="New tasks from your department head will show up here." />
      ) : (
        <Table
          headers={[
            "Issue",
            "Status",
            "Assigned Date",
            "Actions",
          ]}
        >
          {visible.map((issue) => {
            const busy = actionLoadingId === issue.id;
            const canStart = issue.status === "ASSIGNED";
            const canResolve = issue.status === "IN_PROGRESS";

            return (
              <tr key={issue.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-4 align-top">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{issue.title}</p>
                  <p className="mt-1 max-w-lg text-sm text-zinc-600 dark:text-zinc-300">{issue.description}</p>
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">ID: {issue.id}</p>
                </td>
                <td className="px-4 py-4 align-top">
                  <StatusBadge status={issue.status} />
                </td>
                <td className="px-4 py-4 align-top text-sm text-zinc-600 dark:text-zinc-300">
                  {formatDate(issue.createdAt)}
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="flex min-w-[220px] flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void onStart(issue.id)}
                      disabled={!canStart || busy}
                      className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-200"
                    >
                      {busy && canStart ? "Starting..." : "Start Work"}
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenResolution(issue.id)}
                      disabled={!canResolve}
                      className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900"
                    >
                      Submit Resolution
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      )}
    </section>
  );
}
