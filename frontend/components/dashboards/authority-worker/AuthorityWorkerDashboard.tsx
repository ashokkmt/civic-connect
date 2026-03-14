"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthorityWorkerNavbar } from "@/components/layout/AuthorityWorkerNavbar";
import { AuthorityWorkerSidebar } from "@/components/layout/AuthorityWorkerSidebar";
import { AssignedIssues } from "@/components/dashboards/authority-worker/AssignedIssues";
import { SubmitResolution } from "@/components/dashboards/authority-worker/SubmitResolution";
import { WorkerDashboard } from "@/components/dashboards/authority-worker/WorkerDashboard";
import type { WorkerIssue, WorkerResponse, WorkerView } from "@/components/dashboards/authority-worker/types";

export function AuthorityWorkerDashboard() {
  const [activeView, setActiveView] = useState<WorkerView>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [issues, setIssues] = useState<WorkerIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notesByIssue, setNotesByIssue] = useState<Record<string, string>>({});
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const loadAssigned = useCallback(async () => {
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
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAssigned();
  }, [loadAssigned]);

  const inProgressIssues = useMemo(
    () => issues.filter((issue) => issue.status === "IN_PROGRESS"),
    [issues]
  );

  useEffect(() => {
    if (inProgressIssues.length === 0) {
      setSelectedIssueId(null);
      return;
    }

    if (!selectedIssueId || !inProgressIssues.some((issue) => issue.id === selectedIssueId)) {
      setSelectedIssueId(inProgressIssues[0].id);
    }
  }, [inProgressIssues, selectedIssueId]);

  const startIssue = async (issueId: string) => {
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
    const notes = (notesByIssue[issueId] ?? "").trim();
    if (!notes) {
      setError("Resolution notes are required.");
      return;
    }

    setActionLoadingId(issueId);
    setError(null);

    try {
      const response = await fetch(`/api/worker/assigned/${issueId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolutionNotes: notes }),
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

  const totalAssigned = issues.filter((issue) => issue.status === "ASSIGNED" || issue.status === "IN_PROGRESS").length;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(14,165,233,0.12),transparent_35%),radial-gradient(circle_at_85%_10%,rgba(6,182,212,0.1),transparent_30%)]" />
      <div className="flex min-h-screen">
        <AuthorityWorkerSidebar
          activeView={activeView}
          onSelect={setActiveView}
          mobileOpen={mobileOpen}
          onOpenMobile={() => setMobileOpen(true)}
          onCloseMobile={() => setMobileOpen(false)}
          totalAssigned={totalAssigned}
          inProgressCount={inProgressIssues.length}
        />

        <div className="min-w-0 flex-1">
          <AuthorityWorkerNavbar activeView={activeView} onRefresh={() => void loadAssigned()} isRefreshing={loading} />
          <main className="px-4 py-6 sm:px-6 sm:py-8">
            <div className="mx-auto w-full max-w-[1240px] space-y-6">
              {activeView === "overview" ? (
                <WorkerDashboard issues={issues} onNavigate={setActiveView} />
              ) : null}

              {activeView === "assigned_issues" ? (
                <AssignedIssues
                  issues={issues}
                  loading={loading}
                  error={error}
                  requestId={requestId}
                  actionLoadingId={actionLoadingId}
                  onStart={startIssue}
                  onOpenResolution={(issueId) => {
                    setSelectedIssueId(issueId);
                    setActiveView("submit_resolution");
                  }}
                />
              ) : null}

              {activeView === "submit_resolution" ? (
                <SubmitResolution
                  issues={inProgressIssues}
                  selectedIssueId={selectedIssueId}
                  notesByIssue={notesByIssue}
                  actionLoadingId={actionLoadingId}
                  error={error}
                  requestId={requestId}
                  onSelectIssue={setSelectedIssueId}
                  onNoteChange={(issueId, value) =>
                    setNotesByIssue((prev) => ({
                      ...prev,
                      [issueId]: value,
                    }))
                  }
                  onSubmit={resolveIssue}
                />
              ) : null}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
