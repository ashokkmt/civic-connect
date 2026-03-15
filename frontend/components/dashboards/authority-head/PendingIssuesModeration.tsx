import { CheckCircle2, Eye, XCircle } from "lucide-react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { LoadingSkeleton } from "@/components/feedback/LoadingSkeleton";
import { FormError } from "@/components/forms/FormError";
import { StatusBadge } from "@/components/issues/StatusBadge";
import { Card, CardBody } from "@/components/ui/Card";
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

function averageIssueAgeDays(issues: HeadIssue[]) {
  const ages = issues
    .map((issue) => {
      if (!issue.createdAt) {
        return null;
      }

      const timestamp = new Date(issue.createdAt).getTime();
      if (Number.isNaN(timestamp)) {
        return null;
      }

      return Math.max(0, (Date.now() - timestamp) / (1000 * 60 * 60 * 24));
    })
    .filter((value): value is number => value !== null);

  if (!ages.length) {
    return "0.0";
  }

  const avg = ages.reduce((sum, value) => sum + value, 0) / ages.length;
  return avg.toFixed(1);
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

  const avgAge = averageIssueAgeDays(pendingIssues);
  const missingWorkerAssignment = pendingIssues.filter(
    (issue) => !(approveForm[issue.id]?.workerId ?? "").trim()
  ).length;

  return (
    <section className="space-y-6">
      <FormError message={error} />
      {requestId ? <p className="text-xs text-zinc-500 dark:text-zinc-400">Request ID: {requestId}</p> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Total Pending</p>
            <p className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">{pendingIssues.length}</p>
          </CardBody>
        </Card>
        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Need Worker Assignment</p>
            <p className="text-3xl font-black tracking-tight text-amber-600 dark:text-amber-300">{missingWorkerAssignment}</p>
          </CardBody>
        </Card>
        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Avg Report Age</p>
            <p className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              {avgAge} <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">days</span>
            </p>
          </CardBody>
        </Card>
      </div>

      {pendingIssues.length === 0 ? (
        <EmptyState title="No pending issues" description="All reports are currently moderated." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Issue ID</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Reporter</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Category</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Location</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Description Preview</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Thumbnail</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingIssues.map((issue) => {
                  const pendingAction = busyId === issue.id;
                  const approveState = approveForm[issue.id] ?? { severity: "", workerId: "" };

                  return (
                    <tr key={issue.id} className="align-top transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-4 text-xs font-semibold text-blue-600 dark:text-blue-300">{issue.id}</td>
                      <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-200">{issue.reporterId ?? "Unknown reporter"}</td>
                      <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-200">{issue.category ?? "General"}</td>
                      <td className="px-6 py-4 text-xs text-zinc-600 dark:text-zinc-300">{locationLabel(issue)}</td>
                      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-300">
                        <p className="max-w-sm">{issue.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-12 w-12 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]">
                          {issue.imageUrls?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={issue.imageUrls[0]} alt="Issue thumbnail" className="h-full w-full object-cover" />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                              N/A
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={issue.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="min-w-[320px] space-y-2">
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
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {pendingAction ? "Processing..." : "Approve"}
                            </button>
                            <button
                              type="button"
                              onClick={() => void onReject(issue.id)}
                              disabled={pendingAction}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Reject
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition hover:text-zinc-900 dark:text-zinc-200"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
