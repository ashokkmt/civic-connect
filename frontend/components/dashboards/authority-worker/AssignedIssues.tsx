import { useMemo, useState } from "react";
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
  onStart: (issueId: string) => Promise<void>;
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
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {visible.map((issue) => {
                const busy = actionLoadingId === issue.id;
                const canStart = issue.status === "ASSIGNED";
                const canResolve = issue.status === "IN_PROGRESS";
                const priority = (issue.priority ?? issue.severity ?? "MEDIUM").toUpperCase();

                return (
                  <tr key={issue.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-slate-400">#{issue.id.slice(-6).toUpperCase()}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-slate-100">{issue.title}</td>
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
                    <td className="px-6 py-4 text-right">
                      {canStart ? (
                        <button
                          type="button"
                          onClick={() => void onStart(issue.id)}
                          disabled={busy}
                          className="text-sm font-bold text-[#1173d4] transition hover:underline disabled:opacity-60"
                        >
                          {busy ? "Starting..." : "Start Work"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOpenResolution(issue.id)}
                          disabled={!canResolve}
                          className="text-sm font-bold text-[#1173d4] transition hover:underline disabled:opacity-60"
                        >
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
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
