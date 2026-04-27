"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCheck,
  ClipboardList,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Users2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AnalyticsDashboard } from "@/components/dashboards/authority-head/AnalyticsDashboard";
import { PendingIssuesModeration } from "@/components/dashboards/authority-head/PendingIssuesModeration";
import { ResolvedIssuesEscalations } from "@/components/dashboards/authority-head/ResolvedIssuesEscalations";
import { WorkerAnalytics } from "@/components/dashboards/authority-head/WorkerAnalytics";
import { WorkerManagement } from "@/components/dashboards/authority-head/WorkerManagement";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import type {
  HeadApiResponse,
  HeadIssue,
  HeadWorker,
  HeadView,
  HeadWorkerMetric,
  HeadWorkerSummary,
} from "@/components/dashboards/authority-head/types";

function workerNameFromId(workerId: string) {
  const suffix = workerId.slice(-4).toUpperCase();
  return `Worker ${suffix}`;
}

function matchesIssueSearch(issue: HeadIssue, query: string) {
  if (!query) {
    return true;
  }

  const haystack = `${issue.id} ${issue.title} ${issue.description} ${issue.status} ${issue.category ?? ""} ${issue.departmentId ?? ""} ${issue.reporterName ?? ""} ${issue.reporterEmail ?? ""} ${issue.authority?.assignedToWorkerId ?? ""}`.toLowerCase();
  return haystack.includes(query);
}

function matchesWorkerSearch(worker: HeadWorkerSummary, query: string) {
  if (!query) {
    return true;
  }

  const haystack = `${worker.workerId} ${worker.workerName} ${worker.email} ${worker.status}`.toLowerCase();
  return haystack.includes(query);
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

function buildWorkerSummaries(issues: HeadIssue[], apiWorkers: HeadWorker[]): HeadWorkerSummary[] {
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

  const rowsFromMetrics: HeadWorkerSummary[] = apiWorkers.map((worker) => {
    const metric = metricByWorker.get(worker.id);
    const assigned = metric?.assigned ?? 0;
    const completed = metric?.completed ?? 0;
    const pending = metric?.pending ?? 0;
    const status = worker.blocked ? "DISABLED" : pending > 0 ? "ACTIVE" : "IDLE";
    return {
      workerId: worker.id,
      workerName: worker.name?.trim() || workerNameFromId(worker.id),
      email: worker.email,
      status,
      assigned,
      completed,
      pending,
      successRate: assigned ? Math.round((completed / assigned) * 100) : 0,
      lastActiveAt: lastActiveByWorker.get(worker.id),
    };
  });

  return rowsFromMetrics.sort((a, b) => b.successRate - a.successRate || b.assigned - a.assigned);
}

export function AuthorityHeadDashboard() {
  const router = useRouter();

  const [activeView, setActiveView] = useState<HeadView>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 350);

  const [pendingIssues, setPendingIssues] = useState<HeadIssue[]>([]);
  const [departmentIssues, setDepartmentIssues] = useState<HeadIssue[]>([]);
  const [escalations, setEscalations] = useState<HeadIssue[]>([]);
  const [workers, setWorkers] = useState<HeadWorker[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [closeLoadingId, setCloseLoadingId] = useState<string | null>(null);
  const [reassignLoadingId, setReassignLoadingId] = useState<string | null>(null);
  const [escalateLoadingId, setEscalateLoadingId] = useState<string | null>(null);

  const [approveForm, setApproveForm] = useState<Record<string, { severity: string; workerId: string }>>({});
  const [rejectForm, setRejectForm] = useState<Record<string, string>>({});
  const [selectedPendingIssueId, setSelectedPendingIssueId] = useState<string | null>(null);

  const [createWorkerLoading, setCreateWorkerLoading] = useState(false);
  const [createWorkerError, setCreateWorkerError] = useState<string | null>(null);
  const [createWorkerSuccess, setCreateWorkerSuccess] = useState<string | null>(null);

  const searchQuery = debouncedSearch.trim().toLowerCase();

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [pendingRes, issuesRes, escalationsRes, workersRes] = await Promise.all([
        fetch("/api/head/pending?limit=100", { method: "GET", cache: "no-store" }),
        fetch("/api/head/issues?limit=200", { method: "GET", cache: "no-store" }),
        fetch("/api/head/escalations?limit=100", { method: "GET", cache: "no-store" }),
        fetch("/api/head/workers?limit=200&includeBlocked=true", { method: "GET", cache: "no-store" }),
      ]);

      const pendingPayload = (await pendingRes.json()) as HeadApiResponse;
      const issuesPayload = (await issuesRes.json()) as HeadApiResponse;
      const escalationsPayload = (await escalationsRes.json()) as HeadApiResponse;
      const workersPayload = (await workersRes.json()) as { success: boolean; requestId?: string; data?: { items?: HeadWorker[] }; error?: { message?: string } };

      setRequestId(pendingPayload.requestId ?? issuesPayload.requestId ?? escalationsPayload.requestId ?? workersPayload.requestId ?? null);

      if (!pendingRes.ok || !pendingPayload.success) {
        setError(pendingPayload.error?.message ?? "Unable to load pending issues.");
      }
      if (!issuesRes.ok || !issuesPayload.success) {
        setError(issuesPayload.error?.message ?? "Unable to load department issues.");
      }
      if (!escalationsRes.ok || !escalationsPayload.success) {
        setError(escalationsPayload.error?.message ?? "Unable to load escalations.");
      }
      if (!workersRes.ok || !workersPayload.success) {
        setError(workersPayload.error?.message ?? "Unable to load workers.");
      }

      setPendingIssues(pendingPayload.data?.items ?? []);
      setDepartmentIssues(issuesPayload.data?.items ?? []);
      setEscalations(escalationsPayload.data?.items ?? []);
      setWorkers(workersPayload.data?.items ?? []);
    } catch {
      setError("Unable to load head dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [activeView, loadAll]);

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
      await loadAll();
    } catch {
      setCreateWorkerError("Unable to create worker.");
    } finally {
      setCreateWorkerLoading(false);
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

  const escalateIssue = async (issueId: string, reason: string) => {
    setEscalateLoadingId(issueId);
    setError(null);

    try {
      const response = await fetch(`/api/head/issues/${issueId}/escalate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const payload = (await response.json()) as HeadApiResponse;
      setRequestId(payload.requestId ?? null);

      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to escalate issue.");
        return;
      }

      await loadAll();
    } catch {
      setError("Unable to escalate issue.");
    } finally {
      setEscalateLoadingId(null);
    }
  };

  const updateWorker = async (workerId: string, payload: { name: string; email: string }) => {
    setError(null);
    const response = await fetch(`/api/head/workers/${workerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as { success: boolean; requestId?: string; error?: { message?: string } };
    setRequestId(result.requestId ?? null);
    if (!response.ok || !result.success) {
      const message = result.error?.message ?? "Unable to update worker.";
      setError(message);
      throw new Error(message);
    }
    await loadAll();
  };

  const deleteWorker = async (workerId: string) => {
    setError(null);
    const response = await fetch(`/api/head/workers/${workerId}`, { method: "DELETE" });
    const result = (await response.json()) as { success: boolean; requestId?: string; error?: { message?: string } };
    setRequestId(result.requestId ?? null);
    if (!response.ok || !result.success) {
      const message = result.error?.message ?? "Unable to delete worker.";
      setError(message);
      throw new Error(message);
    }
    await loadAll();
  };

  const setWorkerStatus = async (workerId: string, disabled: boolean) => {
    setError(null);
    const endpoint = disabled ? "disable" : "enable";
    const response = await fetch(`/api/head/workers/${workerId}/${endpoint}`, { method: "POST" });
    const result = (await response.json()) as { success: boolean; requestId?: string; error?: { message?: string } };
    setRequestId(result.requestId ?? null);
    if (!response.ok || !result.success) {
      const message = result.error?.message ?? `Unable to ${endpoint} worker.`;
      setError(message);
      throw new Error(message);
    }
    await loadAll();
  };

  const workerSummaries = useMemo(() => buildWorkerSummaries(departmentIssues, workers), [departmentIssues, workers]);

  const filteredPendingIssues = useMemo(
    () => pendingIssues.filter((issue) => matchesIssueSearch(issue, searchQuery)),
    [pendingIssues, searchQuery]
  );
  const filteredDepartmentIssues = useMemo(
    () => departmentIssues.filter((issue) => matchesIssueSearch(issue, searchQuery)),
    [departmentIssues, searchQuery]
  );
  const filteredEscalations = useMemo(
    () => escalations.filter((issue) => matchesIssueSearch(issue, searchQuery)),
    [escalations, searchQuery]
  );
  const filteredWorkerSummaries = useMemo(
    () => workerSummaries.filter((worker) => matchesWorkerSearch(worker, searchQuery)),
    [workerSummaries, searchQuery]
  );
  const filteredWorkerMetrics = useMemo(
    () => buildWorkerMetrics(filteredDepartmentIssues),
    [filteredDepartmentIssues]
  );

  const availableWorkers = useMemo(() => {
    const busyWorkerIds = new Set(
      departmentIssues
        .filter((issue) => issue.status === "ASSIGNED" || issue.status === "IN_PROGRESS")
        .map((issue) => issue.authority?.assignedToWorkerId)
        .filter((workerId): workerId is string => Boolean(workerId))
    );

    return workers.filter((worker) => !worker.blocked && !busyWorkerIds.has(worker.id));
  }, [departmentIssues, workers]);

  const navItems = useMemo(
    () => [
      { id: "dashboard", label: "Dashboard Overview", icon: LayoutDashboard },
      { id: "pending_issues", label: "Pending Issues Moderation", icon: ShieldCheck, badge: `${pendingIssues.length}` },
      {
        id: "assigned_issues",
        label: "Assigned Issues",
        icon: ClipboardList,
        badge: `${departmentIssues.filter((issue) => issue.status === "ASSIGNED" || issue.status === "IN_PROGRESS").length}`,
      },
      { id: "worker_analytics", label: "Worker Analytics", icon: BarChart3 },
      { id: "worker_management", label: "Worker Management", icon: Users2 },
      {
        id: "resolved_issues",
        label: "Resolved Issues",
        icon: CheckCheck,
        badge: `${departmentIssues.filter((issue) => issue.status === "AWAITING_HEAD_CLOSURE").length}`,
      },
      { id: "escalations", label: "Escalations", icon: AlertTriangle, badge: `${escalations.length}` },
    ],
    [departmentIssues, escalations.length, pendingIssues.length]
  );

  const viewMeta = useMemo<Record<HeadView, { title: string; subtitle: string }>>(
    () => ({
      dashboard: {
        title: "Dashboard Overview",
        subtitle: "Real-time performance metrics and operations monitoring.",
      },
      pending_issues: {
        title: "Pending Issues Moderation",
        subtitle: "Review and approve citizen-reported infrastructure and safety concerns.",
      },
      assigned_issues: {
        title: "Assigned Issues",
        subtitle: "Track approved issues that are currently assigned or in progress.",
      },
      worker_analytics: {
        title: "Worker Analytics",
        subtitle: "Compare output, pending load, and success rate across your team.",
      },
      worker_management: {
        title: "Worker Management",
        subtitle: "Assign issues, register workers, and monitor capacity in one place.",
      },
      resolved_issues: {
        title: "Resolved Issues",
        subtitle: "Review completed work and close issues awaiting confirmation.",
      },
      escalations: {
        title: "Escalations",
        subtitle: "Monitor unresolved cases and reassign critical incidents quickly.",
      },
    }),
    []
  );

  const currentMeta = viewMeta[activeView];

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const refreshDashboard = async () => {
    await loadAll();
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex h-full">
        <Sidebar
          items={navItems}
          activeView={activeView}
          onSelect={(viewId) => {
            setActiveView(viewId as HeadView);
            setMobileOpen(false);
          }}
          mobileOpen={mobileOpen}
          onOpenMobile={() => setMobileOpen(true)}
          onCloseMobile={() => setMobileOpen(false)}
          portalLabel="Authority Head"
          helpTitle="Moderation Focus"
          helpDescription="Approve reports, keep worker load balanced, and track escalations before SLA breaches."
          helpButtonLabel="Refresh Dashboard"
          showMobileTrigger={false}
        />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Navbar
            title={currentMeta.title}
            subtitle={currentMeta.subtitle}
            searchPlaceholder="Search issues, workers..."
            searchValue={search}
            onSearchChange={setSearch}
            onRefresh={refreshDashboard}
            isRefreshing={loading}
            refreshLabel="Refresh"
            profileName="Authority Head"
            profileSubtitle="Department Portal"
            onProfile={() => setActiveView("dashboard")}
            onSettings={() => setActiveView("worker_management")}
            onLogout={logout}
            isLoggingOut={isLoggingOut}
            onToggleMobileMenu={() => setMobileOpen(true)}
            mobileMenuButton={<Menu className="h-4 w-4" />}
          />

          <main className="h-[calc(100vh-4rem)] overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-6xl space-y-6">
              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
                  {error}
                </p>
              ) : null}
              {requestId ? <p className="text-xs text-zinc-500 dark:text-zinc-400">Request ID: {requestId}</p> : null}

              {activeView === "dashboard" ? (
                <AnalyticsDashboard issues={filteredDepartmentIssues} workerMetrics={filteredWorkerMetrics} escalationsCount={filteredEscalations.length} />
              ) : null}

              {activeView === "pending_issues" ? (
                <PendingIssuesModeration
                  pendingIssues={filteredPendingIssues}
                  loading={loading}
                  error={error}
                  busyId={busyId}
                  approveForm={approveForm}
                  rejectForm={rejectForm}
                  availableWorkers={availableWorkers}
                  selectedIssueId={selectedPendingIssueId}
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
                  onSelectIssue={setSelectedPendingIssueId}
                  onApprove={approveIssue}
                  onReject={rejectIssue}
                />
              ) : null}

              {activeView === "assigned_issues" ? (
                <ResolvedIssuesEscalations
                  issues={filteredDepartmentIssues}
                  escalations={filteredEscalations}
                  closeLoadingId={closeLoadingId}
                  reassignLoadingId={reassignLoadingId}
                  escalateLoadingId={escalateLoadingId}
                  onCloseIssue={closeIssue}
                  onReassignIssue={reassignIssue}
                  onEscalateIssue={escalateIssue}
                  mode="assigned"
                />
              ) : null}

              {activeView === "worker_analytics" ? <WorkerAnalytics workers={filteredWorkerSummaries} /> : null}

              {activeView === "worker_management" ? (
                <WorkerManagement
                  workers={filteredWorkerSummaries}
                  createWorkerLoading={createWorkerLoading}
                  createWorkerError={createWorkerError}
                  createWorkerSuccess={createWorkerSuccess}
                  onCreateWorker={createWorker}
                  onUpdateWorker={updateWorker}
                  onDeleteWorker={deleteWorker}
                  onSetWorkerStatus={setWorkerStatus}
                />
              ) : null}

              {activeView === "resolved_issues" ? (
                <ResolvedIssuesEscalations
                  issues={filteredDepartmentIssues}
                  escalations={filteredEscalations}
                  closeLoadingId={closeLoadingId}
                  reassignLoadingId={reassignLoadingId}
                  escalateLoadingId={escalateLoadingId}
                  onCloseIssue={closeIssue}
                  onReassignIssue={reassignIssue}
                  onEscalateIssue={escalateIssue}
                  mode="resolved"
                />
              ) : null}

              {activeView === "escalations" ? (
                <ResolvedIssuesEscalations
                  issues={filteredDepartmentIssues}
                  escalations={filteredEscalations}
                  closeLoadingId={closeLoadingId}
                  reassignLoadingId={reassignLoadingId}
                  escalateLoadingId={escalateLoadingId}
                  onCloseIssue={closeIssue}
                  onReassignIssue={reassignIssue}
                  onEscalateIssue={escalateIssue}
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
