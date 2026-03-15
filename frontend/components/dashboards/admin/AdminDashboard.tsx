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

  const sidebarItems = useMemo(
    () => [
      { id: "overview", label: "Dashboard", icon: LayoutDashboard },
      { id: "departments", label: "Departments", icon: Building2 },
      { id: "head_registration", label: "Head Registration", icon: ShieldUser },
      { id: "escalations", label: "Escalated Issues", icon: AlertTriangle, badge: `${escalations.length}` },
    ],
    [escalations.length]
  );

  const loadEscalations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/escalations?limit=100", { method: "GET" });
      const payload = (await response.json()) as ApiResponse<EscalationItem>;
      setRequestId(payload.requestId ?? null);

      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to load escalations.");
        setEscalations([]);
        return;
      }

      const items = payload.data?.items ?? [];
      setEscalations(items);

      setDepartmentRows((prev) => {
        if (prev.length > 0) {
          return prev;
        }

        const departmentMap = new Map<string, number>();
        for (const item of items) {
          const key = item.departmentId ?? "UNASSIGNED";
          departmentMap.set(key, (departmentMap.get(key) ?? 0) + 1);
        }

        return Array.from(departmentMap.entries()).map(([departmentId, count]) => ({
          id: departmentId,
          name: departmentId === "UNASSIGNED" ? "Unassigned Department" : `Department ${departmentId.slice(-4).toUpperCase()}`,
          headName: "Head data pending API",
          totalIssues: count,
          resolvedIssues: 0,
          successRate: 0,
          disabled: false,
        }));
      });
    } catch {
      setError("Unable to load escalations.");
      setEscalations([]);
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

      const syntheticId = `dept-${Date.now()}`;
      setDepartmentRows((prev) => [
        {
          id: syntheticId,
          name: departmentName.trim(),
          headName: "Not assigned",
          totalIssues: 0,
          resolvedIssues: 0,
          successRate: 0,
          disabled: false,
        },
        ...prev,
      ]);
      setDepartmentMessage("Department created successfully.");
      setDepartmentName("");
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

      const id = `head-${Date.now()}`;
      setHeadRows((prev) => [
        {
          id,
          name: headName.trim(),
          email: headEmail.trim(),
          departmentId: headDepartmentId.trim(),
        },
        ...prev,
      ]);

      setDepartmentRows((prev) =>
        prev.map((row) =>
          row.id === headDepartmentId.trim() ? { ...row, headName: headName.trim() } : row
        )
      );

      setHeadMessage("Department head registered successfully.");
      setHeadName("");
      setHeadEmail("");
      setHeadPassword("");
      setHeadDepartmentId("");
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

  const refresh = () => {
    void loadEscalations();
  };

  useEffect(() => {
    void loadEscalations();
  }, [loadEscalations]);

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
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
                    onLoadEscalations={() => void loadEscalations()}
                    onResolveEscalation={(issueId) => void resolveEscalation(issueId)}
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
