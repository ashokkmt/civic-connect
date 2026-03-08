"use client";

import { useEffect, useState } from "react";
import { FormError } from "@/components/forms/FormError";
import { LoadingSkeleton } from "@/components/feedback/LoadingSkeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { StatusBadge } from "@/components/issues/StatusBadge";

type PendingIssue = {
  id: string;
  title: string;
  description: string;
  status: string;
  departmentId?: string;
  createdAt?: string;
};

type PendingResponse = {
  success: boolean;
  requestId?: string;
  data?: { items?: PendingIssue[]; item?: PendingIssue };
  error?: { code?: string; message?: string };
};

export default function HeadPendingPage() {
  const [issues, setIssues] = useState<PendingIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [approveForm, setApproveForm] = useState<Record<string, { severity: string; workerId: string }>>({});
  const [rejectForm, setRejectForm] = useState<Record<string, string>>({});

  const loadPending = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/head/pending?limit=50", { method: "GET" });
      const payload = (await response.json()) as PendingResponse;
      setRequestId(payload.requestId ?? null);

      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to load pending issues.");
        setIssues([]);
        return;
      }

      setIssues(payload.data?.items ?? []);
    } catch {
      setError("Unable to load pending issues.");
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPending();
  }, []);

  const approve = async (issueId: string) => {
    const current = approveForm[issueId] ?? { severity: "", workerId: "" };

    if (!current.severity.trim() || !current.workerId.trim()) {
      setError("Severity and worker ID are required for approval.");
      return;
    }

    setBusyId(issueId);
    setError(null);

    try {
      const response = await fetch(`/api/head/issues/${issueId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ severity: current.severity.trim(), workerId: current.workerId.trim() }),
      });
      const payload = (await response.json()) as PendingResponse;
      setRequestId(payload.requestId ?? null);

      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to approve issue.");
        return;
      }

      setIssues((prev) => prev.filter((item) => item.id !== issueId));
    } catch {
      setError("Unable to approve issue.");
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (issueId: string) => {
    const reason = rejectForm[issueId] ?? "";
    if (!reason.trim()) {
      setError("Rejection reason is required.");
      return;
    }

    setBusyId(issueId);
    setError(null);

    try {
      const response = await fetch(`/api/head/issues/${issueId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const payload = (await response.json()) as PendingResponse;
      setRequestId(payload.requestId ?? null);

      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to reject issue.");
        return;
      }

      setIssues((prev) => prev.filter((item) => item.id !== issueId));
    } catch {
      setError("Unable to reject issue.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Authority head</p>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">Pending moderation</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Review pending issue reports, assign severity, and attach a worker in one approval step.
        </p>
      </header>

      <FormError message={error} />
      {requestId ? <p className="text-xs text-zinc-500 dark:text-zinc-400">Request ID: {requestId}</p> : null}

      {loading ? (
        <LoadingSkeleton label="Loading pending issues" />
      ) : issues.length === 0 ? (
        <EmptyState title="No pending issues" description="All clear for now." />
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => {
            const approving = busyId === issue.id;
            const approveState = approveForm[issue.id] ?? { severity: "", workerId: "" };
            const rejectReason = rejectForm[issue.id] ?? "";

            return (
              <article
                key={issue.id}
                className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{issue.title}</h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">{issue.description}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Issue ID: {issue.id}</p>
                  </div>
                  <StatusBadge status={issue.status} />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1 text-sm">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                      Severity
                    </span>
                    <input
                      value={approveState.severity}
                      onChange={(event) =>
                        setApproveForm((prev) => ({
                          ...prev,
                          [issue.id]: {
                            ...approveState,
                            severity: event.target.value,
                          },
                        }))
                      }
                      placeholder="e.g. High"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-zinc-800 dark:text-zinc-100"
                    />
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                      Worker ID
                    </span>
                    <input
                      value={approveState.workerId}
                      onChange={(event) =>
                        setApproveForm((prev) => ({
                          ...prev,
                          [issue.id]: {
                            ...approveState,
                            workerId: event.target.value,
                          },
                        }))
                      }
                      placeholder="Mongo ObjectID"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-zinc-800 dark:text-zinc-100"
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="space-y-1 text-sm">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                      Rejection reason
                    </span>
                    <textarea
                      value={rejectReason}
                      onChange={(event) =>
                        setRejectForm((prev) => ({
                          ...prev,
                          [issue.id]: event.target.value,
                        }))
                      }
                      rows={2}
                      placeholder="Reason for rejection"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-zinc-800 dark:text-zinc-100"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void approve(issue.id)}
                    disabled={approving}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {approving ? "Processing..." : "Approve and assign"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void reject(issue.id)}
                    disabled={approving}
                    className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200"
                  >
                    Reject issue
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
