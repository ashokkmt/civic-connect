"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { AdminNavbar } from "@/components/layout/AdminNavbar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import type { AdminView } from "@/components/layout/AdminSidebar";
import type { ApiResponse, DepartmentRow, EscalationItem, HeadRow, OverviewStats } from "@/components/dashboards/admin/types";
import { OverviewView } from "@/components/dashboards/admin/views/OverviewView";
import { DepartmentManagementView } from "@/components/dashboards/admin/views/DepartmentManagementView";
import { HeadRegistrationView } from "@/components/dashboards/admin/views/HeadRegistrationView";
import { EscalationsView } from "@/components/dashboards/admin/views/EscalationsView";

export function AdminDashboard() {
  const [activeView, setActiveView] = useState<AdminView>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_10%_15%,rgba(17,115,212,0.13),transparent_35%),radial-gradient(circle_at_85%_8%,rgba(16,185,129,0.10),transparent_30%)]" />
      <div className="flex min-h-screen">
        <AdminSidebar
          activeView={activeView}
          onSelect={setActiveView}
          mobileOpen={mobileOpen}
          onOpenMobile={() => setMobileOpen(true)}
          onCloseMobile={() => setMobileOpen(false)}
          escalationCount={escalations.length}
        />

        <div className="min-w-0 flex-1">
          <AdminNavbar activeView={activeView} onRefresh={refresh} isRefreshing={loading} />

          <main className="px-4 py-6 sm:px-6 sm:py-8">
            <div className="mx-auto w-full max-w-[1280px] space-y-6">
              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
                  {error}
                </p>
              ) : null}
              {requestId ? <p className="text-xs text-zinc-500 dark:text-zinc-400">Request ID: {requestId}</p> : null}

              {activeView === "overview" ? (
                <OverviewView overviewStats={overviewStats} departmentRows={departmentRows} />
              ) : null}

              {activeView === "departments" ? (
                <DepartmentManagementView
                  departmentRows={departmentRows}
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
                  headRows={headRows}
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
                  escalations={escalations}
                  onLoadEscalations={() => void loadEscalations()}
                  onResolveEscalation={(issueId) => void resolveEscalation(issueId)}
                />
              ) : null}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
