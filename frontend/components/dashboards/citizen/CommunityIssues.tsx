"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowBigUp, MapPin } from "lucide-react";
import { AuthActionModal } from "@/components/auth/AuthActionModal";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Badge, toneFromIssueStatus } from "@/components/ui/Badge";
import type { CitizenIssue } from "@/components/dashboards/citizen/types";

type CommunityIssuesProps = {
  issues: CitizenIssue[];
  loading: boolean;
  error: string | null;
  locationReady: boolean;
  onReportIssue: () => void;
};

export function CommunityIssues({ issues, loading, error, locationReady, onReportIssue }: CommunityIssuesProps) {
  const [localIssues, setLocalIssues] = useState<CitizenIssue[]>(issues);
  const [actionLoading, setActionLoading] = useState<"support" | "flag" | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "APPROVED" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED">("ALL");

  useEffect(() => {
    setLocalIssues(issues);
  }, [issues]);

  const sortedIssues = useMemo(
    () =>
      [...localIssues].sort(
        (a, b) =>
          (new Date(b.createdAt ?? "").getTime() || 0) - (new Date(a.createdAt ?? "").getTime() || 0)
      ),
    [localIssues]
  );

  const filteredIssues = useMemo(() => {
    if (statusFilter === "ALL") {
      return sortedIssues;
    }
    return sortedIssues.filter((issue) => issue.status === statusFilter);
  }, [sortedIssues, statusFilter]);

  const [selectedId, setSelectedId] = useState("");

  const selectedIssue = filteredIssues.find((issue) => issue.id === selectedId) ?? filteredIssues[0];
  const hasChosenAction = Boolean(selectedIssue?.isSupporter || selectedIssue?.isFlagged);

  useEffect(() => {
    if (!selectedIssue?.id) {
      return;
    }
    setSelectedId(selectedIssue.id);
  }, [selectedIssue?.id]);

  const updateIssueState = (issueId: string, mutator: (item: CitizenIssue) => CitizenIssue) => {
    setLocalIssues((prev) => prev.map((item) => (item.id === issueId ? mutator(item) : item)));
  };

  const applyConflictState = (issueId: string, message?: string) => {
    const normalized = message?.toLowerCase() ?? "";
    if (normalized.includes("flag")) {
      updateIssueState(issueId, (item) => ({ ...item, isFlagged: true, isSupporter: false }));
      return;
    }
    updateIssueState(issueId, (item) => ({ ...item, isSupporter: true, isFlagged: false }));
  };

  const supportIssue = async () => {
    if (!selectedIssue || hasChosenAction || selectedIssue.isReporter) {
      return;
    }

    setActionLoading("support");
    setActionMessage(null);
    setActionError(null);

    try {
      const response = await fetch(`/api/citizen/issues/${selectedIssue.id}/support`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: { code?: string; message?: string };
      } | null;

      if (!response.ok || !payload?.success) {
        if (response.status === 401) {
          setAuthModalOpen(true);
          return;
        }
        if (
          response.status === 409 &&
          (payload?.error?.code === "DUPLICATE_SUPPORT" || payload?.error?.code === "ACTION_ALREADY_TAKEN")
        ) {
          applyConflictState(selectedIssue.id, payload?.error?.message);
          setActionMessage(payload?.error?.message ?? "You already support this issue.");
          return;
        }
        setActionError(payload?.error?.message ?? "Unable to support this issue.");
        return;
      }

      updateIssueState(selectedIssue.id, (item) => ({
        ...item,
        isSupporter: true,
        isFlagged: false,
        supporterCount: (item.supporterCount ?? 0) + 1,
      }));
      setActionMessage("Support recorded.");
    } catch {
      setActionError("Unable to support this issue.");
    } finally {
      setActionLoading(null);
    }
  };

  const flagIssue = async () => {
    if (!selectedIssue || hasChosenAction || selectedIssue.isReporter) {
      return;
    }

    setActionLoading("flag");
    setActionMessage(null);
    setActionError(null);

    try {
      const response = await fetch(`/api/citizen/issues/${selectedIssue.id}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Citizen flagged this issue for review" }),
      });
      const payload = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: { code?: string; message?: string };
      } | null;

      if (!response.ok || !payload?.success) {
        if (response.status === 401) {
          setAuthModalOpen(true);
          return;
        }
        if (
          response.status === 409 &&
          (payload?.error?.code === "DUPLICATE_FLAG" || payload?.error?.code === "ACTION_ALREADY_TAKEN")
        ) {
          applyConflictState(selectedIssue.id, payload?.error?.message);
          setActionMessage(payload?.error?.message ?? "You already flagged this issue.");
          return;
        }
        setActionError(payload?.error?.message ?? "Unable to flag this issue.");
        return;
      }

      updateIssueState(selectedIssue.id, (item) => ({
        ...item,
        isFlagged: true,
        isSupporter: false,
        flagsCount: (item.flagsCount ?? 0) + 1,
      }));
      setActionMessage("Issue flagged for review.");
    } catch {
      setActionError("Unable to flag this issue.");
    } finally {
      setActionLoading(null);
    }
  };

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

  if (filteredIssues.length === 0) {
    return <EmptyState title="No nearby issues" description="No public reports found for your saved location." />;
  }

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.6fr_1fr]">
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">Active reports in your neighborhood</p>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              aria-label="Filter issues"
            >
              <option value="ALL">All statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
            <button
              type="button"
              onClick={onReportIssue}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-bold text-white"
            >
              + Report Issue
            </button>
          </div>
        </div>

        {filteredIssues.map((issue) => {
          const selected = selectedIssue?.id === issue.id;
          return (
            <button
              key={issue.id}
              type="button"
              onClick={() => setSelectedId(issue.id)}
              className={`flex w-full gap-4 rounded-xl border p-4 text-left shadow-sm transition-colors ${
                selected
                  ? "border-sky-500 bg-sky-50/80 dark:border-sky-500 dark:bg-sky-900/20"
                  : "border-slate-200 bg-white hover:border-sky-300 dark:border-slate-800 dark:bg-slate-900"
              }`}
            >
              <div className="flex shrink-0 flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                <ArrowBigUp className="h-4 w-4 text-sky-600" />
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{issue.supporterCount ?? 0}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Votes</p>
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <Badge tone={toneFromIssueStatus(issue.status)} className="rounded text-[10px] font-bold uppercase tracking-wide">
                    {issue.status.replaceAll("_", " ")}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : "-"}
                  </span>
                </div>

                <p className="truncate text-lg font-bold text-slate-900 dark:text-slate-100">{issue.title}</p>
                <p className="mt-1 line-clamp-1 text-sm text-slate-500 dark:text-slate-400">
                  {issue.description ?? "No description available."}
                </p>
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-400">
                  <MapPin className="h-3.5 w-3.5" />
                  Nearby district
                </p>
              </div>
            </button>
          );
        })}
      </section>

      <aside className="h-fit overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-24 dark:border-slate-800 dark:bg-slate-900">
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <Badge tone={toneFromIssueStatus(selectedIssue.status)} className="rounded-full text-xs font-bold uppercase tracking-wide">
              {selectedIssue.status.replaceAll("_", " ")}
            </Badge>
            <Link href={`/dashboard/citizen/issues/${selectedIssue.id}`} className="text-xs font-semibold text-sky-700 hover:underline dark:text-sky-300">
              Open Detail
            </Link>
          </div>

          <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">{selectedIssue.title}</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{selectedIssue.description ?? "No description available."}</p>

          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Progress</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-200">
                <li>1. Reported</li>
                <li>2. Under Moderation</li>
                <li>3. Assigned</li>
                <li>4. In Progress</li>
                <li>5. Resolved</li>
              </ul>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Community Votes</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{selectedIssue.supporterCount ?? 0}</p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Flags</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{selectedIssue.flagsCount ?? 0}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={supportIssue}
                disabled={Boolean(hasChosenAction || selectedIssue.isReporter || actionLoading)}
                className="rounded-xl bg-sky-600 py-3 text-sm font-bold text-white"
              >
                {actionLoading === "support" ? "Supporting..." : selectedIssue.isSupporter ? "Supported" : "Support Issue"}
              </button>
              <button
                type="button"
                onClick={flagIssue}
                disabled={Boolean(hasChosenAction || selectedIssue.isReporter || actionLoading)}
                className="rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300"
              >
                {actionLoading === "flag" ? "Flagging..." : selectedIssue.isFlagged ? "Flagged" : "Flag Issue"}
              </button>
            </div>

            {actionMessage ? <p className="text-xs text-emerald-700 dark:text-emerald-300">{actionMessage}</p> : null}
            {actionError ? <p className="text-xs text-red-600 dark:text-red-300">{actionError}</p> : null}
          </div>
        </div>
      </aside>

      <AuthActionModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
