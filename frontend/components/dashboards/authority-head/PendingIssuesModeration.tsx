import { EmptyState } from "@/components/feedback/EmptyState";
import { LoadingSkeleton } from "@/components/feedback/LoadingSkeleton";
import { FormError } from "@/components/forms/FormError";
import { StatusBadge } from "@/components/issues/StatusBadge";
import { Table } from "@/components/ui/Table";
import type { HeadIssue } from "@/components/dashboards/authority-head/types";

type PendingIssuesModerationProps = {
  pendingIssues: HeadIssue[];
  loading: boolean;
  error: string | null;
  requestId: string | null;
  busyId: string | null;
  approveForm: Record<string, { severity: string; workerId: string }>;
  rejectForm: Record<string, string>;
  onApproveFormChange: (issueId: string, field: "severity" | "workerId", value: string) => void;
  onRejectFormChange: (issueId: string, value: string) => void;
  onApprove: (issueId: string) => Promise<void>;
  onReject: (issueId: string) => Promise<void>;
};

function locationLabel(issue: HeadIssue) {
  const coords = issue.location?.coordinates;
  if (!coords || coords.length < 2) {
    return "-";
  }

  return `${coords[1].toFixed(3)}, ${coords[0].toFixed(3)}`;
}

export function PendingIssuesModeration({
  pendingIssues,
  loading,
  error,
  requestId,
  busyId,
  approveForm,
  rejectForm,
  onApproveFormChange,
  onRejectFormChange,
  onApprove,
  onReject,
}: PendingIssuesModerationProps) {
  if (loading) {
    return <LoadingSkeleton label="Loading pending issues" />;
  }

  return (
    <section className="space-y-4">
      <FormError message={error} />
      {requestId ? <p className="text-xs text-zinc-500 dark:text-zinc-400">Request ID: {requestId}</p> : null}

      {pendingIssues.length === 0 ? (
        <EmptyState title="No pending issues" description="All reports are currently moderated." />
      ) : (
        <Table
          headers={[
            "Issue ID",
            "Reporter",
            "Category",
            "Location",
            "Description Preview",
            "Status",
            "Actions",
          ]}
        >
          {pendingIssues.map((issue) => {
            const pendingAction = busyId === issue.id;
            const approveState = approveForm[issue.id] ?? { severity: "", workerId: "" };

            return (
              <tr key={issue.id} className="border-b border-[var(--border)] align-top last:border-0">
                <td className="px-4 py-4 text-xs font-semibold text-blue-600 dark:text-blue-300">{issue.id}</td>
                <td className="px-4 py-4 text-sm text-zinc-700 dark:text-zinc-200">{issue.reporterId ?? "Unknown reporter"}</td>
                <td className="px-4 py-4 text-sm text-zinc-700 dark:text-zinc-200">{issue.category ?? "General"}</td>
                <td className="px-4 py-4 text-xs text-zinc-600 dark:text-zinc-300">{locationLabel(issue)}</td>
                <td className="px-4 py-4 text-sm text-zinc-600 dark:text-zinc-300">
                  <p className="max-w-sm">{issue.description}</p>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={issue.status} />
                </td>
                <td className="px-4 py-4">
                  <div className="min-w-[280px] space-y-2">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        value={approveState.severity}
                        onChange={(event) => onApproveFormChange(issue.id, "severity", event.target.value)}
                        placeholder="Severity"
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1.5 text-xs text-zinc-800 dark:text-zinc-100"
                      />
                      <input
                        value={approveState.workerId}
                        onChange={(event) => onApproveFormChange(issue.id, "workerId", event.target.value)}
                        placeholder="Worker ID"
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1.5 text-xs text-zinc-800 dark:text-zinc-100"
                      />
                    </div>
                    <textarea
                      value={rejectForm[issue.id] ?? ""}
                      onChange={(event) => onRejectFormChange(issue.id, event.target.value)}
                      rows={2}
                      placeholder="Rejection reason"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1.5 text-xs text-zinc-800 dark:text-zinc-100"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void onApprove(issue.id)}
                        disabled={pendingAction}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {pendingAction ? "Processing..." : "Approve"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void onReject(issue.id)}
                        disabled={pendingAction}
                        className="rounded-lg border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200"
                      >
                        Reject
                      </button>
                    </div>
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
