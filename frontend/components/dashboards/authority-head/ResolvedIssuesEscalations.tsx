import { useState } from "react";
import { AlertTriangle, Timer } from "lucide-react";
import { FormError } from "@/components/forms/FormError";
import { IssueDetailView, type IssueDetailData } from "@/components/issues/detail/IssueDetailView";
import { StatusBadge } from "@/components/issues/StatusBadge";
import type { HeadIssue } from "@/components/dashboards/authority-head/types";
import { formatIssueDisplayId } from "@/lib/issues/displayId";

type ResolvedIssuesEscalationsProps = {
  issues: HeadIssue[];
  escalations: HeadIssue[];
  closeLoadingId: string | null;
  reassignLoadingId: string | null;
  escalateLoadingId: string | null;
  onCloseIssue: (issueId: string) => Promise<void>;
  onReassignIssue: (issueId: string, workerId: string) => Promise<void>;
  onEscalateIssue: (issueId: string, reason: string) => Promise<void>;
  mode: "assigned" | "resolved" | "escalations";
};

function dateLabel(value?: string) {
  if (!value) {
    return "-";
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
}

function toIssueDetailData(issue: HeadIssue): IssueDetailData {
  const rawCoordinates = issue.location?.coordinates;
  const hasCoordinates = Array.isArray(rawCoordinates) && rawCoordinates.length >= 2;
  const coordinates = hasCoordinates ? ([Number(rawCoordinates[0]), Number(rawCoordinates[1])] as [number, number]) : undefined;

  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    status: issue.status,
    supporterCount: issue.supporterCount,
    flagsCount: issue.flagsCount,
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
    departmentId: issue.departmentId,
    imageUrls: issue.imageUrls,
    resolutionImageUrls: issue.resolutionImageUrls ?? issue.authority?.resolutionImageUrls,
    resolutionNotes: issue.resolutionNotes ?? issue.authority?.resolutionNotes,
    location: coordinates ? { coordinates } : undefined,
    reporterId: issue.reporterId,
    reporterName: issue.reporterName,
    reporterEmail: issue.reporterEmail,
    statusHistory: issue.statusHistory,
    // Disable citizen support/flag actions in authority context.
    isReporter: true,
  };
}

export function ResolvedIssuesEscalations({
  issues,
  escalations,
  closeLoadingId,
  reassignLoadingId,
  escalateLoadingId,
  onCloseIssue,
  onReassignIssue,
  onEscalateIssue,
  mode,
}: ResolvedIssuesEscalationsProps) {
  const [reassignWorkerByIssue, setReassignWorkerByIssue] = useState<Record<string, string>>({});
  const [escalationReasonByIssue, setEscalationReasonByIssue] = useState<Record<string, string>>({});
  const [localError, setLocalError] = useState<string | null>(null);
  const [issueDetail, setIssueDetail] = useState<IssueDetailData | null>(null);
  const [issueDetailLoading, setIssueDetailLoading] = useState(false);
  const [issueDetailError, setIssueDetailError] = useState<string | null>(null);

  const resolvedLike = issues.filter(
    (issue) => issue.status === "RESOLVED" || issue.status === "AWAITING_HEAD_CLOSURE" || issue.status === "CLOSED"
  );
  const assignedLike = issues.filter((issue) => issue.status === "ASSIGNED" || issue.status === "IN_PROGRESS");
  const stalledEscalations = escalations.filter((issue) => issue.status !== "CLOSED").length;

  const openIssueDetail = async (issue: HeadIssue) => {
    setIssueDetailError(null);
    setIssueDetail(toIssueDetailData(issue));
    setIssueDetailLoading(true);

    try {
      const response = await fetch(`/api/head/issues/${issue.id}`, { method: "GET" });
      const payload = (await response.json().catch(() => null)) as
        | { success?: boolean; data?: { item?: HeadIssue }; error?: { message?: string } }
        | null;

      if (!response.ok || !payload?.success || !payload.data?.item) {
        setIssueDetailError(payload?.error?.message ?? "Showing currently cached issue details.");
        return;
      }

      setIssueDetail(toIssueDetailData(payload.data.item));
    } catch {
      setIssueDetailError("Showing currently cached issue details.");
    } finally {
      setIssueDetailLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <FormError message={localError} />

      {mode === "assigned" ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Assigned & Active Department Issues</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Issue ID</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Title</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Worker</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Started</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {assignedLike.map((issue) => (
                  <tr key={issue.id}>
                    <td className="px-6 py-4 text-xs font-semibold text-blue-600 dark:text-blue-300">{formatIssueDisplayId(issue.id)}</td>
                    <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-200">{issue.title || "Untitled issue"}</td>
                    <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-200">{issue.authority?.assignedToWorkerId ?? "-"}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={issue.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-200">{dateLabel(issue.authority?.startedAt)}</td>
                    <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-200">{dateLabel(issue.authority?.deadlineAt)}</td>
                  </tr>
                ))}
                {assignedLike.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                      No assigned or in-progress department issues yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {mode === "resolved" ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Resolved & Confirmation Queue</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Issue ID</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Assigned Worker</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Completion Date</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Confirmation Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {resolvedLike.map((issue) => (
                  <tr
                    key={issue.id}
                    className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    onClick={() => {
                      void openIssueDetail(issue);
                    }}
                  >
                    <td className="px-6 py-4 text-xs font-semibold text-blue-600 dark:text-blue-300">{formatIssueDisplayId(issue.id)}</td>
                    <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-200">{issue.authority?.assignedToWorkerId ?? "-"}</td>
                    <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-200">{dateLabel(issue.authority?.resolvedAt ?? issue.updatedAt)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={issue.status} />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void openIssueDetail(issue);
                        }}
                        className="mr-2 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-[var(--surface-muted)] dark:text-zinc-200"
                      >
                        View Issue
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void onCloseIssue(issue.id);
                        }}
                        disabled={issue.status !== "AWAITING_HEAD_CLOSURE" || closeLoadingId === issue.id}
                        className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-200"
                      >
                        {closeLoadingId === issue.id ? "Closing..." : "Close Issue"}
                      </button>
                    </td>
                  </tr>
                ))}
                {resolvedLike.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                      No resolved issues are available yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {mode === "escalations" ? (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-red-300/70 bg-red-50/95 p-4 dark:border-red-800/60 dark:bg-red-950/45">
              <Timer className="mt-0.5 h-4 w-4 text-red-600 dark:text-red-300" />
              <div>
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">Stagnant Escalations</h3>
                <p className="mt-1 text-sm text-red-700/90 dark:text-red-300/90">
                  {stalledEscalations} issues require immediate intervention to avoid SLA breaches.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-amber-300/70 bg-amber-50/95 p-4 dark:border-amber-800/60 dark:bg-amber-950/45">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-300" />
              <div>
                <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Escalate To Admin</h3>
                <p className="mt-1 text-sm text-amber-700/90 dark:text-amber-200">
                  Add a reason and escalate unresolved or disputed department issues for admin intervention.
                </p>
              </div>
            </div>
          </div>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Escalated Issues</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Reassign stalled issues to available workers.</p>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Issue ID</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Assigned Worker</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Reassign Worker ID</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Escalate Reason</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {escalations.map((issue) => (
                    <tr key={issue.id}>
                      <td className="px-6 py-4 text-xs font-semibold text-rose-600 dark:text-rose-300">{formatIssueDisplayId(issue.id)}</td>
                      <td className="px-6 py-4"><StatusBadge status={issue.status} /></td>
                      <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-200">{issue.authority?.assignedToWorkerId ?? "-"}</td>
                      <td className="px-6 py-4">
                        <input
                          value={reassignWorkerByIssue[issue.id] ?? ""}
                          onChange={(event) =>
                            setReassignWorkerByIssue((prev) => ({
                              ...prev,
                              [issue.id]: event.target.value,
                            }))
                          }
                          placeholder="Worker ID"
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1.5 text-xs text-zinc-800 dark:text-zinc-100"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          value={escalationReasonByIssue[issue.id] ?? issue.escalationReason ?? ""}
                          onChange={(event) =>
                            setEscalationReasonByIssue((prev) => ({
                              ...prev,
                              [issue.id]: event.target.value,
                            }))
                          }
                          placeholder="Reason for admin escalation"
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1.5 text-xs text-zinc-800 dark:text-zinc-100"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const workerId = (reassignWorkerByIssue[issue.id] ?? "").trim();
                              if (!workerId) {
                                setLocalError("Worker ID is required to reassign escalated issue.");
                                return;
                              }
                              setLocalError(null);
                              void onReassignIssue(issue.id, workerId);
                            }}
                            disabled={reassignLoadingId === issue.id}
                            className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {reassignLoadingId === issue.id ? "Reassigning..." : "Reassign"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const reason = (escalationReasonByIssue[issue.id] ?? issue.escalationReason ?? "").trim();
                              if (!reason) {
                                setLocalError("Escalation reason is required.");
                                return;
                              }
                              setLocalError(null);
                              void onEscalateIssue(issue.id, reason);
                            }}
                            disabled={escalateLoadingId === issue.id}
                            className="rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {escalateLoadingId === issue.id ? "Escalating..." : "Escalate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {escalations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                        No escalations reported by backend.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}

      {issueDetail ? (
        <div className="fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close issue detail"
            className="absolute inset-0"
            onClick={() => {
              setIssueDetail(null);
              setIssueDetailError(null);
            }}
          />
          <div className="relative mx-auto flex h-full w-full max-w-7xl items-center justify-center p-4">
            <section className="relative z-10 h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Issue Detail</h3>
                <button
                  type="button"
                  onClick={() => {
                    setIssueDetail(null);
                    setIssueDetailError(null);
                  }}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-[var(--surface-muted)] dark:text-zinc-200"
                >
                  Close
                </button>
              </div>

              {issueDetailError ? <FormError message={issueDetailError} /> : null}
              {issueDetailLoading ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading latest issue details...</p>
              ) : null}

              <IssueDetailView
                issue={issueDetail}
                backHref="/dashboard/authority-head?view=resolved_issues"
                backLabel="Resolved Issues"
              />
            </section>
          </div>
        </div>
      ) : null}
    </section>
  );
}
