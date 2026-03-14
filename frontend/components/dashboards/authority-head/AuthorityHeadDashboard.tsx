"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthorityHeadNavbar } from "@/components/layout/AuthorityHeadNavbar";
import { AuthorityHeadSidebar } from "@/components/layout/AuthorityHeadSidebar";
import { AnalyticsDashboard } from "@/components/dashboards/authority-head/AnalyticsDashboard";
import { PendingIssuesModeration } from "@/components/dashboards/authority-head/PendingIssuesModeration";
import { ResolvedIssuesEscalations } from "@/components/dashboards/authority-head/ResolvedIssuesEscalations";
import { WorkerAnalytics } from "@/components/dashboards/authority-head/WorkerAnalytics";
import { WorkerManagement } from "@/components/dashboards/authority-head/WorkerManagement";
import type {
  HeadApiResponse,
  HeadIssue,
  HeadView,
  HeadWorkerMetric,
  HeadWorkerStatus,
  HeadWorkerSummary,
} from "@/components/dashboards/authority-head/types";

type CreatedWorker = {
  workerId: string;
  workerName: string;
  email: string;
  status: HeadWorkerStatus;
};

function workerNameFromId(workerId: string) {
  const suffix = workerId.slice(-4).toUpperCase();
  return `Worker ${suffix}`;
}

function buildWorkerMetrics(issues: HeadIssue[]): HeadWorkerMetric[] {
  const byWorker = new Map<string, { assigned: number; completed: number; pending: number }>();

  for (const issue of issues) {
    const workerId = issue.authority?.assignedToWorkerId;
    if (!workerId) {
      continue;
    }

    const current = byWorker.get(workerId) ?? { assigned: 0, completed: 0, pending: 0 };
    current.assigned += 1;
    if (issue.status === "RESOLVED" || issue.status === "AWAITING_HEAD_CLOSURE" || issue.status === "CLOSED") {
      current.completed += 1;
    } else if (issue.status === "ASSIGNED" || issue.status === "IN_PROGRESS") {
      current.pending += 1;
    }
    byWorker.set(workerId, current);
  }

  return Array.from(byWorker.entries())
    .map(([workerId, values]) => ({
      workerId,
      assigned: values.assigned,
      completed: values.completed,
      pending: values.pending,
      successRate: values.assigned ? Math.round((values.completed / values.assigned) * 100) : 0,
    }))
    .sort((a, b) => b.successRate - a.successRate);
}

function buildWorkerSummaries(issues: HeadIssue[], createdWorkers: CreatedWorker[]): HeadWorkerSummary[] {
  const metricByWorker = new Map(buildWorkerMetrics(issues).map((metric) => [metric.workerId, metric]));
  const lastActiveByWorker = new Map<string, string>();

  for (const issue of issues) {
    const workerId = issue.authority?.assignedToWorkerId;
    if (!workerId || !issue.updatedAt) {
      continue;
    }

    const previous = lastActiveByWorker.get(workerId);
    if (!previous || new Date(issue.updatedAt).getTime() > new Date(previous).getTime()) {
      lastActiveByWorker.set(workerId, issue.updatedAt);
    }
  }

  const rowsFromMetrics: HeadWorkerSummary[] = Array.from(metricByWorker.values()).map((metric) => ({
    workerId: metric.workerId,
    workerName: workerNameFromId(metric.workerId),
    email: "Email unavailable from API",
    status: metric.pending > 0 ? "ACTIVE" : "IDLE",
    assigned: metric.assigned,
    completed: metric.completed,
    pending: metric.pending,
    successRate: metric.successRate,
    lastActiveAt: lastActiveByWorker.get(metric.workerId),
  }));

  for (const created of createdWorkers) {
    if (metricByWorker.has(created.workerId)) {
      continue;
    }

    rowsFromMetrics.push({
      workerId: created.workerId,
      workerName: created.workerName,
      email: created.email,
      status: created.status,
      assigned: 0,
      completed: 0,
      pending: 0,
      successRate: 0,
      lastActiveAt: undefined,
    });
  }

  return rowsFromMetrics.sort((a, b) => b.successRate - a.successRate || b.assigned - a.assigned);
}

export function AuthorityHeadDashboard() {
  const [activeView, setActiveView] = useState<HeadView>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [pendingIssues, setPendingIssues] = useState<HeadIssue[]>([]);
  const [departmentIssues, setDepartmentIssues] = useState<HeadIssue[]>([]);
  const [escalations, setEscalations] = useState<HeadIssue[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [closeLoadingId, setCloseLoadingId] = useState<string | null>(null);
  const [reassignLoadingId, setReassignLoadingId] = useState<string | null>(null);

  const [approveForm, setApproveForm] = useState<Record<string, { severity: string; workerId: string }>>({});
  const [rejectForm, setRejectForm] = useState<Record<string, string>>({});

  const [createWorkerLoading, setCreateWorkerLoading] = useState(false);
  const [createWorkerError, setCreateWorkerError] = useState<string | null>(null);
  const [createWorkerSuccess, setCreateWorkerSuccess] = useState<string | null>(null);
  const [createdWorkers, setCreatedWorkers] = useState<CreatedWorker[]>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [pendingRes, issuesRes, escalationsRes] = await Promise.all([
        fetch("/api/head/pending?limit=100", { method: "GET" }),
        fetch("/api/head/issues?limit=200", { method: "GET" }),
        fetch("/api/head/escalations?limit=100", { method: "GET" }),
      ]);

      const pendingPayload = (await pendingRes.json()) as HeadApiResponse;
      const issuesPayload = (await issuesRes.json()) as HeadApiResponse;
      const escalationsPayload = (await escalationsRes.json()) as HeadApiResponse;

      setRequestId(pendingPayload.requestId ?? issuesPayload.requestId ?? escalationsPayload.requestId ?? null);

      if (!pendingRes.ok || !pendingPayload.success) {
        setError(pendingPayload.error?.message ?? "Unable to load pending issues.");
      }
      if (!issuesRes.ok || !issuesPayload.success) {
        setError(issuesPayload.error?.message ?? "Unable to load department issues.");
      }
      if (!escalationsRes.ok || !escalationsPayload.success) {
        setError(escalationsPayload.error?.message ?? "Unable to load escalations.");
      }

      setPendingIssues(pendingPayload.data?.items ?? []);
      setDepartmentIssues(issuesPayload.data?.items ?? []);
      setEscalations(escalationsPayload.data?.items ?? []);
    } catch {
      setError("Unable to load head dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const approveIssue = async (issueId: string) => {
    const values = approveForm[issueId] ?? { severity: "", workerId: "" };
    if (!values.severity.trim() || !values.workerId.trim()) {
      setError("Severity and worker ID are required.");
      return;
    }

    setBusyId(issueId);
    setError(null);
    try {
      const response = await fetch(`/api/head/issues/${issueId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ severity: values.severity.trim(), workerId: values.workerId.trim() }),
      });
      const payload = (await response.json()) as HeadApiResponse;
      setRequestId(payload.requestId ?? null);

      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to approve issue.");
        return;
      }

      await loadAll();
    } catch {
      setError("Unable to approve issue.");
    } finally {
      setBusyId(null);
    }
  };

  const rejectIssue = async (issueId: string) => {
    const reason = (rejectForm[issueId] ?? "").trim();
    if (!reason) {
      setError("Rejection reason is required.");
      return;
    }

    setBusyId(issueId);
    setError(null);
    try {
      const response = await fetch(`/api/head/issues/${issueId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const payload = (await response.json()) as HeadApiResponse;
      setRequestId(payload.requestId ?? null);

      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to reject issue.");
        return;
      }

      await loadAll();
    } catch {
      setError("Unable to reject issue.");
    } finally {
      setBusyId(null);
    }
  };

  const createWorker = async (email: string, password: string) => {
    setCreateWorkerError(null);
    setCreateWorkerSuccess(null);

    if (!email.trim() || !password.trim()) {
      setCreateWorkerError("Email and password are required.");
      return;
    }

    setCreateWorkerLoading(true);
    try {
      const response = await fetch("/api/head/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const payload = (await response.json()) as HeadApiResponse;
      setRequestId(payload.requestId ?? null);

      if (!response.ok || !payload.success) {
        setCreateWorkerError(payload.error?.message ?? "Unable to create worker.");
        return;
      }

      setCreateWorkerSuccess("Worker account created successfully.");
      setCreatedWorkers((prev) => {
        if (prev.some((worker) => worker.email.toLowerCase() === email.trim().toLowerCase())) {
          return prev;
        }

        const syntheticId = `new-${Date.now()}`;
        return [
          ...prev,
          {
            workerId: syntheticId,
            workerName: workerNameFromId(syntheticId),
            email: email.trim(),
            status: "IDLE",
          },
        ];
      });
      await loadAll();
    } catch {
      setCreateWorkerError("Unable to create worker.");
    } finally {
      setCreateWorkerLoading(false);
    }
  };

  const quickAssignApprove = async (issueId: string, workerId: string, severity: string) => {
    setBusyId(issueId);
    setError(null);
    try {
      const response = await fetch(`/api/head/issues/${issueId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId, severity }),
      });
      const payload = (await response.json()) as HeadApiResponse;
      setRequestId(payload.requestId ?? null);

      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to approve and assign issue.");
        return;
      }

      await loadAll();
    } catch {
      setError("Unable to approve and assign issue.");
    } finally {
      setBusyId(null);
    }
  };

  const closeIssue = async (issueId: string) => {
    setCloseLoadingId(issueId);
    setError(null);

    try {
      const response = await fetch(`/api/head/issues/${issueId}/close`, { method: "POST" });
      const payload = (await response.json()) as HeadApiResponse;
      setRequestId(payload.requestId ?? null);

      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to close issue.");
        return;
      }

      await loadAll();
    } catch {
      setError("Unable to close issue.");
    } finally {
      setCloseLoadingId(null);
    }
  };

  const reassignIssue = async (issueId: string, workerId: string) => {
    setReassignLoadingId(issueId);
    setError(null);

    try {
      const response = await fetch(`/api/head/issues/${issueId}/reassign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId }),
      });
      const payload = (await response.json()) as HeadApiResponse;
      setRequestId(payload.requestId ?? null);

      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to reassign escalated issue.");
        return;
      }

      await loadAll();
    } catch {
      setError("Unable to reassign escalated issue.");
    } finally {
      setReassignLoadingId(null);
    }
  };

  const workerMetrics = useMemo(() => buildWorkerMetrics(departmentIssues), [departmentIssues]);
  const workerSummaries = useMemo(
    () => buildWorkerSummaries(departmentIssues, createdWorkers),
    [createdWorkers, departmentIssues]
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_10%_15%,rgba(37,99,235,0.12),transparent_35%),radial-gradient(circle_at_85%_8%,rgba(6,182,212,0.10),transparent_32%)]" />
      <div className="flex min-h-screen">
        <AuthorityHeadSidebar
          activeView={activeView}
          onSelect={setActiveView}
          mobileOpen={mobileOpen}
          onOpenMobile={() => setMobileOpen(true)}
          onCloseMobile={() => setMobileOpen(false)}
          pendingCount={pendingIssues.length}
          escalationsCount={escalations.length}
        />

        <div className="min-w-0 flex-1">
          <AuthorityHeadNavbar activeView={activeView} onRefresh={() => void loadAll()} isRefreshing={loading} />
          <main className="px-4 py-6 sm:px-6 sm:py-8">
            <div className="mx-auto w-full max-w-[1260px] space-y-6">
              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
                  {error}
                </p>
              ) : null}
              {requestId ? <p className="text-xs text-zinc-500 dark:text-zinc-400">Request ID: {requestId}</p> : null}

              {activeView === "dashboard" ? (
                <AnalyticsDashboard issues={departmentIssues} workerMetrics={workerMetrics} escalationsCount={escalations.length} />
              ) : null}

              {activeView === "pending_issues" ? (
                <PendingIssuesModeration
                  pendingIssues={pendingIssues}
                  loading={loading}
                  error={error}
                  requestId={requestId}
                  busyId={busyId}
                  approveForm={approveForm}
                  rejectForm={rejectForm}
                  onApproveFormChange={(issueId, field, value) =>
                    setApproveForm((prev) => ({
                      ...prev,
                      [issueId]: {
                        ...(prev[issueId] ?? { severity: "", workerId: "" }),
                        [field]: value,
                      },
                    }))
                  }
                  onRejectFormChange={(issueId, value) =>
                    setRejectForm((prev) => ({
                      ...prev,
                      [issueId]: value,
                    }))
                  }
                  onApprove={approveIssue}
                  onReject={rejectIssue}
                />
              ) : null}

              {activeView === "worker_analytics" ? <WorkerAnalytics workers={workerSummaries} /> : null}

              {activeView === "worker_management" ? (
                <WorkerManagement
                  pendingIssues={pendingIssues}
                  workers={workerSummaries}
                  createWorkerLoading={createWorkerLoading}
                  createWorkerError={createWorkerError}
                  createWorkerSuccess={createWorkerSuccess}
                  onCreateWorker={createWorker}
                  onQuickAssignApprove={quickAssignApprove}
                />
              ) : null}

              {activeView === "resolved_issues" ? (
                <ResolvedIssuesEscalations
                  issues={departmentIssues}
                  escalations={escalations}
                  closeLoadingId={closeLoadingId}
                  reassignLoadingId={reassignLoadingId}
                  onCloseIssue={closeIssue}
                  onReassignIssue={reassignIssue}
                  mode="resolved"
                />
              ) : null}

              {activeView === "escalations" ? (
                <ResolvedIssuesEscalations
                  issues={departmentIssues}
                  escalations={escalations}
                  closeLoadingId={closeLoadingId}
                  reassignLoadingId={reassignLoadingId}
                  onCloseIssue={closeIssue}
                  onReassignIssue={reassignIssue}
                  mode="escalations"
                />
              ) : null}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
