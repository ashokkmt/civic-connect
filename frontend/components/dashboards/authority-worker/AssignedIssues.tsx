import { Fragment, useMemo, useState } from "react";
import { CalendarDays, MapPin, RefreshCcw, ShieldAlert, Trophy } from "lucide-react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { LoadingSkeleton } from "@/components/feedback/LoadingSkeleton";
import { FormError } from "@/components/forms/FormError";
import type { WorkerIssue } from "@/components/dashboards/authority-worker/types";

type AssignedIssuesProps = {
  issues: WorkerIssue[];
  loading: boolean;
  error: string | null;
  requestId: string | null;
  actionLoadingId: string | null;
  onStart: (issueId: string, deadlineAt: string) => Promise<void>;
  onRefresh: () => Promise<void>;
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
  onRefresh,
  onOpenResolution,
}: AssignedIssuesProps) {
  const [tab, setTab] = useState<"all" | "high" | "recent">("all");
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
  const [deadlineByIssue, setDeadlineByIssue] = useState<Record<string, string>>({});

  const visible = useMemo(() => {
    const base = issues.filter((issue) => issue.status === "ASSIGNED" || issue.status === "IN_PROGRESS");
    if (tab === "high") {
      return base.filter((issue) => {
        const flag = (issue.priority ?? issue.severity ?? "").toUpperCase();
        return flag === "HIGH" || flag === "CRITICAL";
      });
    }
    if (tab === "recent") {
      return [...base].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
    }
    return base;
  }, [issues, tab]);

  const isOverdue = (issue: WorkerIssue) => {
    const raw = issue.authority?.deadlineAt;
    if (!raw) {
      return false;
    }
    const dueAt = new Date(raw).getTime();
    if (Number.isNaN(dueAt)) {
      return false;
    }
    return (issue.status === "ASSIGNED" || issue.status === "IN_PROGRESS") && dueAt < Date.now();
  };

  if (loading) {
    return <LoadingSkeleton label="Loading assigned issues" />;
  }

  return (
    <section className="space-y-6">
      <FormError message={error} />
      {requestId ? <p className="text-xs text-zinc-500 dark:text-zinc-400">Request ID: {requestId}</p> : null}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black leading-tight tracking-[-0.033em] text-slate-900 dark:text-slate-100">Assigned Issues</h1>
          <p className="text-base text-slate-500 dark:text-slate-400">You have {visible.length} active maintenance tasks.</p>
        </div>
        <button
          type="button"
          onClick={() => void onRefresh()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1173d4] px-4 text-sm font-bold text-white transition hover:bg-[#0f66bd]"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh Tasks
        </button>
      </div>

      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-6 sm:gap-8">
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`border-b-2 pb-3 pt-2 text-sm font-bold tracking-wide ${
              tab === "all"
                ? "border-[#1173d4] text-[#1173d4]"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            All Issues
          </button>
          <button
            type="button"
            onClick={() => setTab("high")}
            className={`border-b-2 pb-3 pt-2 text-sm font-bold tracking-wide ${
              tab === "high"
                ? "border-[#1173d4] text-[#1173d4]"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            High Priority
          </button>
          <button
            type="button"
            onClick={() => setTab("recent")}
            className={`border-b-2 pb-3 pt-2 text-sm font-bold tracking-wide ${
              tab === "recent"
                ? "border-[#1173d4] text-[#1173d4]"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            Recently Assigned
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState title="No assigned issues" description="New tasks from your department head will show up here." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Issue ID</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Issue Title</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Category</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Location</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Priority</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Assigned Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Deadline</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {visible.map((issue) => {
                const busy = actionLoadingId === issue.id;
                const canStart = issue.status === "ASSIGNED";
                const canResolve = issue.status === "IN_PROGRESS";
                const priority = (issue.priority ?? issue.severity ?? "MEDIUM").toUpperCase();
                const expanded = expandedIssueId === issue.id;

                return (
                  <Fragment key={issue.id}>
                    <tr className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-slate-400">#{issue.id.slice(-6).toUpperCase()}</td>
                      <td className="px-6 py-4 text-sm">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{issue.title}</p>
                        <p className="mt-1 line-clamp-2 max-w-md text-xs text-slate-500 dark:text-slate-400">{issue.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                          {issue.category ?? "General"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {issue.location?.coordinates ? "Coordinates available" : "Field location"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            priority === "CRITICAL"
                              ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                              : priority === "HIGH"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : priority === "LOW"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}
                        >
                          {priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{formatDate(issue.createdAt)}</td>
                      <td className="px-6 py-4 text-xs">
                        {issue.authority?.deadlineAt ? (
                          <span className={isOverdue(issue) ? "font-semibold text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-300"}>
                            {formatDate(issue.authority.deadlineAt)}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">Not set</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedIssueId((prev) => (prev === issue.id ? null : issue.id));
                            }}
                            className="inline-flex h-8 items-center justify-center rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            {expanded ? "Hide Details" : "View Details"}
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenResolution(issue.id)}
                            disabled={!canResolve}
                            className="inline-flex h-8 items-center justify-center rounded-md bg-[#1173d4] px-3 text-xs font-semibold text-white transition hover:bg-[#0f66bd] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Submit Resolution
                          </button>
                        </div>
                      </td>
                    </tr>

                    {expanded ? (
                      <tr className="bg-slate-50/90 dark:bg-slate-900/40">
                        <td colSpan={8} className="px-6 pb-6 pt-2">
                          <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
                            <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                              <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Issue details</p>
                                <h3 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-100">{issue.title}</h3>
                                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{issue.description}</p>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Location</p>
                                  <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-100">
                                    {issue.location?.coordinates
                                      ? `${issue.location.coordinates[1]?.toFixed(4)}, ${issue.location.coordinates[0]?.toFixed(4)}`
                                      : "No coordinates available"}
                                  </p>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Status</p>
                                  <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-100">{issue.status}</p>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Created</p>
                                  <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-100">{formatDate(issue.createdAt)}</p>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Deadline</p>
                                  <p className={isOverdue(issue) ? "mt-1 text-sm font-semibold text-red-600 dark:text-red-400" : "mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-100"}>
                                    {issue.authority?.deadlineAt ? formatDate(issue.authority.deadlineAt) : "Not set"}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Uploaded images</p>
                                {issue.imageUrls && issue.imageUrls.length > 0 ? (
                                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
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
                            </section>

                            <aside className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Work actions</p>

                              {canStart ? (
                                <div className="space-y-3">
                                  <label className="space-y-1">
                                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Work deadline</span>
                                    <input
                                      type="date"
                                      value={deadlineByIssue[issue.id] ?? ""}
                                      min={new Date().toISOString().slice(0, 10)}
                                      onChange={(event) =>
                                        setDeadlineByIssue((prev) => ({
                                          ...prev,
                                          [issue.id]: event.target.value,
                                        }))
                                      }
                                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    />
                                  </label>

                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDeadlineByIssue((prev) => ({ ...prev, [issue.id]: "" }));
                                      }}
                                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                      Clear
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const deadline = deadlineByIssue[issue.id] ?? "";
                                        if (!deadline) {
                                          return;
                                        }
                                        void onStart(issue.id, deadline);
                                      }}
                                      disabled={busy || !(deadlineByIssue[issue.id] ?? "")}
                                      className="rounded-md bg-[#1173d4] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0f66bd] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {busy ? "Starting..." : "Start Work"}
                                    </button>
                                  </div>
                                </div>
                              ) : null}

                              {canResolve ? (
                                <button
                                  type="button"
                                  onClick={() => onOpenResolution(issue.id)}
                                  className="inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                                >
                                  Submit Resolution
                                </button>
                              ) : null}

                              {!canStart && !canResolve ? (
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">No action available for current status.</p>
                              ) : null}
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
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="rounded-lg bg-red-100 p-3 text-red-600 dark:bg-red-900/20 dark:text-red-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">High Priority Tasks</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {
                visible.filter((issue) => {
                  const priority = (issue.priority ?? issue.severity ?? "").toUpperCase();
                  return priority === "HIGH" || priority === "CRITICAL";
                }).length
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="rounded-lg bg-[#1173d4]/10 p-3 text-[#1173d4]">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Due by End of Day</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{Math.min(visible.length, 3)}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="rounded-lg bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Success Rate (Weekly)</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">94%</p>
          </div>
        </div>
      </div>
    </section>
  );
}
