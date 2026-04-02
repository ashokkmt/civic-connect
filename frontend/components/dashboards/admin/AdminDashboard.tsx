"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { AlertTriangle, Building2, LayoutDashboard, Menu, ShieldUser } from "lucide-react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import type { AdminView, ApiResponse, DepartmentRow, EscalationItem, HeadRow, OverviewStats } from "@/components/dashboards/admin/types";
import { OverviewView } from "@/components/dashboards/admin/views/OverviewView";
import { DepartmentManagementView } from "@/components/dashboards/admin/views/DepartmentManagementView";
import { HeadRegistrationView } from "@/components/dashboards/admin/views/HeadRegistrationView";
import { EscalationsView } from "@/components/dashboards/admin/views/EscalationsView";

type MeResponse = {
  success: boolean;
  data?: {
    user?: {
      name?: string;
      email?: string;
    };
  };
};

type DepartmentApiItem = {
  id?: string;
  name?: string;
};

type DepartmentMetricApiItem = {
  departmentId?: string;
  name?: string;
  totalIssues?: number;
  resolvedIssues?: number;
};

type AuthorityApiItem = {
  id?: string;
  name?: string;
  email?: string;
  departmentId?: string;
};

export function AdminDashboard() {
  const router = useRouter();

  const [activeView, setActiveView] = useState<AdminView>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("Admin User");
  const [email, setEmail] = useState("admin@civicconnect.local");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);

  const [escalations, setEscalations] = useState<EscalationItem[]>([]);
  const [departmentRows, setDepartmentRows] = useState<DepartmentRow[]>([]);
  const [headRows, setHeadRows] = useState<HeadRow[]>([]);

  const [departmentName, setDepartmentName] = useState("");
  const [departmentSaving, setDepartmentSaving] = useState(false);
  const [departmentMessage, setDepartmentMessage] = useState<string | null>(null);

  const [headName, setHeadName] = useState("");
  const [headEmail, setHeadEmail] = useState("");
  const [headPassword, setHeadPassword] = useState("");
  const [headDepartmentId, setHeadDepartmentId] = useState("");
  const [headSaving, setHeadSaving] = useState(false);
  const [headMessage, setHeadMessage] = useState<string | null>(null);
  const [reassignLoadingId, setReassignLoadingId] = useState<string | null>(null);
  const [notifyLoadingId, setNotifyLoadingId] = useState<string | null>(null);
  const [actionToast, setActionToast] = useState<{ key: string; message: string; tone: "success" | "error" } | null>(null);

  const sidebarItems = useMemo(
    () => [
      { id: "overview", label: "Dashboard", icon: LayoutDashboard },
      { id: "departments", label: "Departments", icon: Building2 },
      { id: "head_registration", label: "Head Registration", icon: ShieldUser },
      { id: "escalations", label: "Escalated Issues", icon: AlertTriangle, badge: `${escalations.length}` },
    ],
    [escalations.length]
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [escalationsRes, departmentsRes, metricsRes, headsRes] = await Promise.all([
        fetch("/api/admin/escalations?limit=100", { method: "GET" }),
        fetch("/api/admin/departments?limit=200", { method: "GET" }),
        fetch("/api/admin/departments/metrics", { method: "GET" }),
        fetch("/api/admin/authority-heads?limit=200", { method: "GET" }),
      ]);

      const escalationsPayload = (await escalationsRes.json()) as ApiResponse<EscalationItem>;
      const departmentsPayload = (await departmentsRes.json()) as ApiResponse<DepartmentApiItem>;
      const metricsPayload = (await metricsRes.json()) as ApiResponse<DepartmentMetricApiItem>;
      const headsPayload = (await headsRes.json()) as ApiResponse<AuthorityApiItem>;

      setRequestId(
        escalationsPayload.requestId ??
          departmentsPayload.requestId ??
          metricsPayload.requestId ??
          headsPayload.requestId ??
          null
      );

      if (!escalationsRes.ok || !escalationsPayload.success) {
        setError(escalationsPayload.error?.message ?? "Unable to load escalations.");
      }
      if (!departmentsRes.ok || !departmentsPayload.success) {
        setError(departmentsPayload.error?.message ?? "Unable to load departments.");
      }
      if (!metricsRes.ok || !metricsPayload.success) {
        setError(metricsPayload.error?.message ?? "Unable to load department metrics.");
      }
      if (!headsRes.ok || !headsPayload.success) {
        setError(headsPayload.error?.message ?? "Unable to load authority heads.");
      }

      const escalationItems = escalationsPayload.data?.items ?? [];
      const departmentItems = departmentsPayload.data?.items ?? [];
      const metricItems = metricsPayload.data?.items ?? [];
      const authorityItems = headsPayload.data?.items ?? [];

      setEscalations(escalationItems);

      const headByDepartment = new Map<string, string>();
      const headRowsMapped: HeadRow[] = authorityItems.map((head, index) => {
        const id = head.id?.trim() || `head-${index}`;
        const departmentId = head.departmentId?.trim() || "UNASSIGNED";
        const name = head.name?.trim() || `Head ${id.slice(-4).toUpperCase()}`;
        headByDepartment.set(departmentId, name);
        return {
          id,
          name,
          email: head.email?.trim() || "",
          departmentId,
        };
      });
      setHeadRows(headRowsMapped);

      const metricsByDepartment = new Map<string, DepartmentMetricApiItem>();
      for (const metric of metricItems) {
        if (metric.departmentId) {
          metricsByDepartment.set(metric.departmentId, metric);
        }
      }

      const rows: DepartmentRow[] = departmentItems.map((department, index) => {
        const id = department.id?.trim() || `dept-${index}`;
        const metric = metricsByDepartment.get(id);
        const totalIssues = Number(metric?.totalIssues ?? 0);
        const resolvedIssues = Number(metric?.resolvedIssues ?? 0);
        return {
          id,
          name: department.name?.trim() || `Department ${id.slice(-4).toUpperCase()}`,
          headName: headByDepartment.get(id) ?? "Not assigned",
          totalIssues,
          resolvedIssues,
          successRate: totalIssues ? Math.round((resolvedIssues / totalIssues) * 100) : 0,
          disabled: false,
        };
      });
      setDepartmentRows(rows);
    } catch {
      setError("Unable to load admin dashboard data.");
      setEscalations([]);
      setDepartmentRows([]);
      setHeadRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const overviewStats = useMemo<OverviewStats>(() => {
    const totalDepartments = departmentRows.length;
    const totalHeads = headRows.length;
    const pendingEscalations = escalations.length;

    const knownTotalIssues = departmentRows.reduce((sum, row) => sum + row.totalIssues, 0);
    const knownResolvedIssues = departmentRows.reduce((sum, row) => sum + row.resolvedIssues, 0);

    return {
      totalDepartments,
      totalHeads,
      totalIssuesReported: knownTotalIssues,
      totalIssuesResolved: knownResolvedIssues,
      pendingEscalations,
    };
  }, [departmentRows, escalations, headRows]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/auth/me", { method: "GET" });
        const payload = (await response.json()) as MeResponse;

        if (!response.ok || !payload.success) {
          return;
        }

        const user = payload.data?.user;
        if (user?.name) {
          setName(user.name);
        }
        if (user?.email) {
          setEmail(user.email);
        }
      } catch {
        // Keep dashboard usable even if profile fetch fails.
      }
    };

    void loadProfile();
  }, []);

  const createDepartment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDepartmentMessage(null);
    setError(null);

    if (!departmentName.trim()) {
      setError("Department name is required.");
      return;
    }

    setDepartmentSaving(true);
    try {
      const response = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: departmentName.trim() }),
      });
      const payload = (await response.json()) as ApiResponse;
      setRequestId(payload.requestId ?? null);

      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to create department.");
        return;
      }

      setDepartmentMessage("Department created successfully.");
      setDepartmentName("");
      await loadAll();
    } catch {
      setError("Unable to create department.");
    } finally {
      setDepartmentSaving(false);
    }
  };

  const registerHead = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHeadMessage(null);
    setError(null);

    if (!headName.trim() || !headEmail.trim() || !headPassword.trim() || !headDepartmentId.trim()) {
      setError("Name, email, department assignment, and password are required.");
      return;
    }

    setHeadSaving(true);
    try {
      const response = await fetch("/api/admin/authority-heads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: headName.trim(),
          email: headEmail.trim(),
          password: headPassword,
          departmentId: headDepartmentId.trim(),
        }),
      });

      const payload = (await response.json()) as ApiResponse;
      setRequestId(payload.requestId ?? null);

      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to register department head.");
        return;
      }

      setHeadMessage("Department head registered successfully.");
      setHeadName("");
      setHeadEmail("");
      setHeadPassword("");
      setHeadDepartmentId("");
      await loadAll();
    } catch {
      setError("Unable to register department head.");
    } finally {
      setHeadSaving(false);
    }
  };

  const resolveEscalation = async (issueId: string) => {
    setError(null);

    try {
      const response = await fetch(`/api/admin/escalations/${issueId}/resolve`, { method: "POST" });
      const payload = (await response.json()) as ApiResponse;
      setRequestId(payload.requestId ?? null);

      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to mark escalation handled.");
        return;
      }

      setEscalations((prev) => prev.filter((item) => (item.id ?? item.issueId) !== issueId));
    } catch {
      setError("Unable to mark escalation handled.");
    }
  };

  const disableDepartment = (departmentId: string) => {
    setDepartmentRows((prev) =>
      prev.map((row) => (row.id === departmentId ? { ...row, disabled: !row.disabled } : row))
    );
  };

  const reassignEscalationDepartment = async (issueId: string, departmentId: string) => {
    setReassignLoadingId(issueId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/escalations/${issueId}/reassign-department`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentId }),
      });
      const payload = (await response.json()) as ApiResponse;
      setRequestId(payload.requestId ?? null);

      if (!response.ok || !payload.success) {
        const message = payload.error?.message ?? "Unable to reassign escalation.";
        setError(message);
        setActionToast({
          key: `${Date.now()}-reassign-error-${issueId}`,
          message,
          tone: "error",
        });
        return;
      }

      const deptName = departmentRows.find((row) => row.id === departmentId)?.name ?? "selected department";
      setActionToast({
        key: `${Date.now()}-reassign-${issueId}`,
        message: `Escalation ${issueId.slice(-6).toUpperCase()} reassigned to ${deptName}.`,
        tone: "success",
      });
      await loadAll();
    } catch {
      const message = "Unable to reassign escalation.";
      setError(message);
      setActionToast({
        key: `${Date.now()}-reassign-error-${issueId}`,
        message,
        tone: "error",
      });
    } finally {
      setReassignLoadingId(null);
    }
  };

  const notifyEscalationHead = async (issueId: string) => {
    setNotifyLoadingId(issueId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/escalations/${issueId}/notify-head`, { method: "POST" });
      const payload = (await response.json()) as ApiResponse;
      setRequestId(payload.requestId ?? null);

      if (!response.ok || !payload.success) {
        const message = payload.error?.message ?? "Unable to notify authority head.";
        setError(message);
        setActionToast({
          key: `${Date.now()}-notify-error-${issueId}`,
          message,
          tone: "error",
        });
        return;
      }

      setActionToast({
        key: `${Date.now()}-notify-${issueId}`,
        message: `Authority head notified for escalation ${issueId.slice(-6).toUpperCase()}.`,
        tone: "success",
      });
      await loadAll();
    } catch {
      const message = "Unable to notify authority head.";
      setError(message);
      setActionToast({
        key: `${Date.now()}-notify-error-${issueId}`,
        message,
        tone: "error",
      });
    } finally {
      setNotifyLoadingId(null);
    }
  };

  const refresh = () => {
    void loadAll();
  };

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!actionToast) {
      return;
    }

    const timer = window.setTimeout(() => {
      setActionToast(null);
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [actionToast]);

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

  const searchQuery = search.trim().toLowerCase();

  const filteredDepartmentRows = useMemo(() => {
    if (!searchQuery) {
      return departmentRows;
    }

    return departmentRows.filter((row) => {
      return (
        row.name.toLowerCase().includes(searchQuery) ||
        row.headName.toLowerCase().includes(searchQuery) ||
        row.id.toLowerCase().includes(searchQuery)
      );
    });
  }, [departmentRows, searchQuery]);

  const filteredHeadRows = useMemo(() => {
    if (!searchQuery) {
      return headRows;
    }

    return headRows.filter((row) => {
      return (
        row.name.toLowerCase().includes(searchQuery) ||
        row.email.toLowerCase().includes(searchQuery) ||
        row.departmentId.toLowerCase().includes(searchQuery)
      );
    });
  }, [headRows, searchQuery]);

  const filteredEscalations = useMemo(() => {
    if (!searchQuery) {
      return escalations;
    }

    return escalations.filter((item) => {
      const id = (item.id ?? item.issueId ?? "").toLowerCase();
      const departmentId = (item.departmentId ?? "").toLowerCase();
      const level = (item.escalationLevel ?? "").toLowerCase();

      return id.includes(searchQuery) || departmentId.includes(searchQuery) || level.includes(searchQuery);
    });
  }, [escalations, searchQuery]);

  const viewMeta: Record<AdminView, { title: string; subtitle: string }> = {
    overview: {
      title: "System Metrics Dashboard",
      subtitle: "Track platform-wide operations, department outcomes, and escalated issue load.",
    },
    departments: {
      title: "Department Management",
      subtitle: "Create departments and monitor department-level issue resolution performance.",
    },
    head_registration: {
      title: "Register Department Head",
      subtitle: "Provision leadership accounts with secure department assignment.",
    },
    escalations: {
      title: "Escalated Issues",
      subtitle: "Manage overdue critical issues that require admin intervention.",
    },
  };

  const currentView = viewMeta[activeView];

  return (
    <div className="h-screen overflow-hidden bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          items={sidebarItems}
          activeView={activeView}
          onSelect={(view) => {
            setActiveView(view as AdminView);
            setMobileOpen(false);
          }}
          mobileOpen={mobileOpen}
          onOpenMobile={() => setMobileOpen(true)}
          onCloseMobile={() => setMobileOpen(false)}
          portalLabel="Admin Portal"
          helpTitle="Governance Support"
          helpDescription="Need support with escalations or platform operations?"
          helpButtonLabel="Contact Platform Team"
          showMobileTrigger={false}
        />

        <div className="min-w-0 flex-1">
          <div className="flex h-screen flex-col overflow-hidden">
            <Navbar
              title={currentView.title}
              subtitle={currentView.subtitle}
              searchPlaceholder="Search departments, heads, escalations..."
              searchValue={search}
              onSearchChange={setSearch}
              profileName={name}
              profileSubtitle={email}
              onProfile={() => setActiveView("overview")}
              onSettings={refresh}
              onLogout={logout}
              isLoggingOut={isLoggingOut}
              onToggleMobileMenu={() => setMobileOpen(true)}
              mobileMenuButton={<Menu className="h-4 w-4" />}
            />

            <main className="h-[calc(100vh-4rem)] overflow-y-auto p-4 sm:p-6 lg:p-8">
              {actionToast ? (
                <div className="pointer-events-none fixed right-4 top-20 z-50 sm:right-6">
                  <div
                    key={actionToast.key}
                    className={
                      actionToast.tone === "success"
                        ? "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-900/25 dark:text-emerald-200"
                        : "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 shadow-sm dark:border-red-900/60 dark:bg-red-900/25 dark:text-red-200"
                    }
                  >
                    {actionToast.message}
                  </div>
                </div>
              ) : null}
              <div className="mx-auto w-full max-w-6xl space-y-6">
                {error ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
                    {error}
                  </p>
                ) : null}
                {loading ? <p className="text-xs text-zinc-500 dark:text-zinc-400">Refreshing data...</p> : null}
                {requestId ? <p className="text-xs text-zinc-500 dark:text-zinc-400">Request ID: {requestId}</p> : null}

                {activeView === "overview" ? (
                  <OverviewView overviewStats={overviewStats} departmentRows={filteredDepartmentRows} />
                ) : null}

                {activeView === "departments" ? (
                  <DepartmentManagementView
                    departmentRows={filteredDepartmentRows}
                    departmentName={departmentName}
                    departmentSaving={departmentSaving}
                    departmentMessage={departmentMessage}
                    onDepartmentNameChange={setDepartmentName}
                    onCreateDepartment={createDepartment}
                    onToggleDepartment={disableDepartment}
                  />
                ) : null}

                {activeView === "head_registration" ? (
                  <HeadRegistrationView
                    headRows={filteredHeadRows}
                    departments={departmentRows}
                    headName={headName}
                    headEmail={headEmail}
                    headPassword={headPassword}
                    headDepartmentId={headDepartmentId}
                    headSaving={headSaving}
                    headMessage={headMessage}
                    onHeadNameChange={setHeadName}
                    onHeadEmailChange={setHeadEmail}
                    onHeadPasswordChange={setHeadPassword}
                    onHeadDepartmentChange={setHeadDepartmentId}
                    onRegisterHead={registerHead}
                  />
                ) : null}

                {activeView === "escalations" ? (
                  <EscalationsView
                    escalations={filteredEscalations}
                    departments={departmentRows}
                    reassignLoadingId={reassignLoadingId}
                    notifyLoadingId={notifyLoadingId}
                    onLoadEscalations={() => void loadAll()}
                    onResolveEscalation={(issueId) => void resolveEscalation(issueId)}
                    onReassignDepartment={(issueId, departmentId) => void reassignEscalationDepartment(issueId, departmentId)}
                    onNotifyHead={(issueId) => void notifyEscalationHead(issueId)}
                  />
                ) : null}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
