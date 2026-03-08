"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { LoadingSkeleton } from "@/components/feedback/LoadingSkeleton";
import { FormError } from "@/components/forms/FormError";
import { StatusBadge } from "@/components/issues/StatusBadge";

type WorkerIssue = {
  id: string;
  title: string;
  description: string;
  status: string;
  supporterCount?: number;
  createdAt?: string;
};

type WorkerResponse = {
  success: boolean;
  requestId?: string;
  data?: { items?: WorkerIssue[] };
  error?: { message?: string };
};

export default function WorkerIssuesPage() {
  const [issues, setIssues] = useState<WorkerIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);

  const visibleIssues = useMemo(
    () => issues.filter((issue) => issue.status === "ASSIGNED" || issue.status === "IN_PROGRESS"),
    [issues]
  );

  const loadAssigned = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/worker/assigned?limit=100", { method: "GET" });
      const payload = (await response.json()) as WorkerResponse;
      setRequestId(payload.requestId ?? null);

      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to load assigned issues.");
        setIssues([]);
        return;
      }

      setIssues(payload.data?.items ?? []);
    } catch {
      setError("Unable to load assigned issues.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAssigned();
  }, []);

  const startWork = async (issueId: string) => {
    setActionLoadingId(issueId);
    setError(null);

    try {
      const response = await fetch(`/api/worker/assigned/${issueId}/start`, { method: "POST" });
      const payload = (await response.json()) as WorkerResponse;
      setRequestId(payload.requestId ?? null);

      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to start work.");
        return;
      }

      await loadAssigned();
    } catch {
      setError("Unable to start work.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const resolveIssue = async (issueId: string) => {
    const resolutionNotes = (notes[issueId] ?? "").trim();
    if (!resolutionNotes) {
      setError("Resolution notes are required.");
      return;
    }

    setActionLoadingId(issueId);
    setError(null);

    try {
      const response = await fetch(`/api/worker/assigned/${issueId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolutionNotes }),
      });
      const payload = (await response.json()) as WorkerResponse;
      setRequestId(payload.requestId ?? null);

      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to resolve issue.");
        return;
      }

      await loadAssigned();
    } catch {
      setError("Unable to resolve issue.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Worker</p>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">Assigned issues</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Move assigned issues through start and resolve transitions with strict status gating.
        </p>
      </header>

      <FormError message={error} />
      {requestId ? <p className="text-xs text-zinc-500 dark:text-zinc-400">Request ID: {requestId}</p> : null}

      {loading ? (
        <LoadingSkeleton label="Loading assigned issues" />
      ) : visibleIssues.length === 0 ? (
        <EmptyState title="No assigned issues" description="New assignments will appear here." />
      ) : (
        <div className="space-y-4">
          {visibleIssues.map((issue) => {
            const busy = actionLoadingId === issue.id;
            const canStart = issue.status === "ASSIGNED";
            const canResolve = issue.status === "IN_PROGRESS";

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

                <label className="space-y-1 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                    Resolution notes
                  </span>
                  <textarea
                    value={notes[issue.id] ?? ""}
                    onChange={(event) =>
                      setNotes((prev) => ({
                        ...prev,
                        [issue.id]: event.target.value,
                      }))
                    }
                    rows={2}
                    placeholder="Describe the completed work"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-zinc-800 dark:text-zinc-100"
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void startWork(issue.id)}
                    disabled={!canStart || busy}
                    className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-200"
                  >
                    {busy && canStart ? "Starting..." : "Start work"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void resolveIssue(issue.id)}
                    disabled={!canResolve || busy}
                    className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900"
                  >
                    {busy && canResolve ? "Resolving..." : "Resolve"}
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
