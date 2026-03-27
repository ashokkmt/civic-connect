import { CheckCircle2, Eye, XCircle } from "lucide-react";
import { Fragment } from "react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { LoadingSkeleton } from "@/components/feedback/LoadingSkeleton";
import { FormError } from "@/components/forms/FormError";
import { StatusBadge } from "@/components/issues/StatusBadge";
import { Card, CardBody } from "@/components/ui/Card";
import type { HeadIssue, HeadWorker } from "@/components/dashboards/authority-head/types";

const SEVERITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

type PendingIssuesModerationProps = {
  pendingIssues: HeadIssue[];
  loading: boolean;
  error: string | null;
  busyId: string | null;
  approveForm: Record<string, { severity: string; workerId: string }>;
  rejectForm: Record<string, string>;
  availableWorkers: HeadWorker[];
  selectedIssueId: string | null;
  onApproveFormChange: (issueId: string, field: "severity" | "workerId", value: string) => void;
  onRejectFormChange: (issueId: string, value: string) => void;
  onSelectIssue: (issueId: string | null) => void;
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

function reporterLabel(issue: HeadIssue) {
  return issue.reporterName?.trim() || issue.reporterEmail?.trim() || issue.reporterId?.trim() || "Unknown reporter";
}

function shortIssueId(id: string) {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

function formattedDate(value?: string) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString();
}

export function PendingIssuesModeration({
  pendingIssues,
  loading,
  error,
  busyId,
  approveForm,
  rejectForm,
  availableWorkers,
  selectedIssueId,
  onApproveFormChange,
  onRejectFormChange,
  onSelectIssue,
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
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Issue</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Reporter</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Category</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Submitted</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingIssues.map((issue) => {
                  const pendingAction = busyId === issue.id;
                  const approveState = approveForm[issue.id] ?? { severity: issue.severity ?? "", workerId: "" };
                  const expanded = selectedIssueId === issue.id;

                  return (
                    <Fragment key={issue.id}>
                      <tr className="align-top transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{shortIssueId(issue.id)}</p>
                          <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">{issue.title || "Untitled issue"}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-200">{reporterLabel(issue)}</td>
                        <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-200">{issue.category ?? "General"}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={issue.status} />
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-600 dark:text-zinc-300">{formattedDate(issue.createdAt)}</td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => onSelectIssue(expanded ? null : issue.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:text-zinc-900 dark:text-zinc-200"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            {expanded ? "Hide" : "Take action"}
                          </button>
                        </td>
                      </tr>

                      {expanded ? (
                        <tr className="bg-slate-50/80 dark:bg-slate-900/40">
                          <td colSpan={6} className="px-6 pb-6 pt-2">
                            <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
                              <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                                <header className="space-y-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Issue details</p>
                                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{issue.title || "Untitled issue"}</h3>
                                  <p className="text-sm text-zinc-600 dark:text-zinc-300">{issue.description}</p>
                                </header>

                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                                    <p className="text-xs uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Reporter</p>
                                    <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-100">{reporterLabel(issue)}</p>
                                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">ID: {issue.reporterId ?? "N/A"}</p>
                                  </div>
                                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                                    <p className="text-xs uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Location</p>
                                    <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-100">{locationLabel(issue)}</p>
                                  </div>
                                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                                    <p className="text-xs uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Category</p>
                                    <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-100">{issue.category ?? "General"}</p>
                                  </div>
                                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                                    <p className="text-xs uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Submitted</p>
                                    <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-100">{formattedDate(issue.createdAt)}</p>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Uploaded images</p>
                                  {issue.imageUrls && issue.imageUrls.length > 0 ? (
                                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                      {issue.imageUrls.map((url) => (
                                        <a
                                          key={url}
                                          href={url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="block overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
                                        >
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img src={url} alt="Issue" className="h-32 w-full object-cover" loading="lazy" />
                                        </a>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">No uploaded images available.</p>
                                  )}
                                </div>
                              </div>

                              <aside className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Moderation actions</p>

                                <label className="space-y-1">
                                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Severity</span>
                                  <select
                                    value={approveState.severity}
                                    onChange={(event) => onApproveFormChange(issue.id, "severity", event.target.value)}
                                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-2 text-xs text-zinc-800 dark:text-zinc-100"
                                  >
                                    <option value="">Select severity</option>
                                    {SEVERITY_OPTIONS.map((option) => (
                                      <option key={option} value={option}>
                                        {option}
                                      </option>
                                    ))}
                                  </select>
                                </label>

                                <label className="space-y-1">
                                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Currently free worker</span>
                                  <select
                                    value={approveState.workerId}
                                    onChange={(event) => onApproveFormChange(issue.id, "workerId", event.target.value)}
                                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-2 text-xs text-zinc-800 dark:text-zinc-100"
                                  >
                                    <option value="">Select worker</option>
                                    {availableWorkers.map((worker) => (
                                      <option key={worker.id} value={worker.id}>
                                        {(worker.name?.trim() || worker.email) + " · " + worker.id}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                {availableWorkers.length === 0 ? (
                                  <p className="text-xs text-amber-600 dark:text-amber-300">No free workers available right now.</p>
                                ) : null}

                                <label className="space-y-1">
                                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Rejection reason</span>
                                  <textarea
                                    value={rejectForm[issue.id] ?? ""}
                                    onChange={(event) => onRejectFormChange(issue.id, event.target.value)}
                                    rows={3}
                                    placeholder="Reason required when rejecting"
                                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1.5 text-xs text-zinc-800 dark:text-zinc-100"
                                  />
                                </label>

                                <div className="space-y-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => void onApprove(issue.id)}
                                    disabled={pendingAction}
                                    className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {pendingAction ? "Processing..." : "Approve & assign"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void onReject(issue.id)}
                                    disabled={pendingAction}
                                    className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                    Reject issue
                                  </button>
                                </div>
                              </aside>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
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
