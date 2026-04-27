"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, LayoutDashboard, Menu, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useAuthSession } from "@/lib/auth/session-context";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { AssignedIssues } from "@/components/dashboards/authority-worker/AssignedIssues";
import { MyWork } from "@/components/dashboards/authority-worker/MyWork";
import { SubmitResolution } from "@/components/dashboards/authority-worker/SubmitResolution";
import { WorkerDashboard } from "@/components/dashboards/authority-worker/WorkerDashboard";
import type { WorkerIssue, WorkerResponse, WorkerView } from "@/components/dashboards/authority-worker/types";

export function AuthorityWorkerDashboard() {
  const router = useRouter();
  const { user } = useAuthSession();

  const [activeView, setActiveView] = useState<WorkerView>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);

  const [issues, setIssues] = useState<WorkerIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notesByIssue, setNotesByIssue] = useState<Record<string, string>>({});
  const [resolutionImageUrlsByIssue, setResolutionImageUrlsByIssue] = useState<Record<string, string[]>>({});
  const [resolutionUploadingByIssue, setResolutionUploadingByIssue] = useState<Record<string, boolean>>({});
  const [resolutionUploadErrorByIssue, setResolutionUploadErrorByIssue] = useState<Record<string, string | null>>({});
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const loadAssigned = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/worker/assigned?limit=100", { method: "GET", cache: "no-store" });
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
  }, [activeView, loadAssigned]);

  const searchQuery = debouncedSearch.trim().toLowerCase();

  const filteredIssues = useMemo(() => {
    if (!searchQuery) {
      return issues;
    }

    return issues.filter((issue) => {
      const haystack = `${issue.id} ${issue.title} ${issue.description} ${issue.status} ${issue.category ?? ""} ${issue.priority ?? ""}`.toLowerCase();
      return haystack.includes(searchQuery);
    });
  }, [issues, searchQuery]);

  const inProgressIssues = useMemo(
    () => filteredIssues.filter((issue) => issue.status === "IN_PROGRESS"),
    [filteredIssues]
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

  const startIssue = async (issueId: string, deadlineAt: string) => {
    setActionLoadingId(issueId);
    setError(null);

    if (!deadlineAt.trim()) {
      setError("Deadline date is required before starting work.");
      setActionLoadingId(null);
      return;
    }

    try {
      const response = await fetch(`/api/worker/assigned/${issueId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deadlineAt }),
      });
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

    if (resolutionUploadingByIssue[issueId]) {
      setError("Please wait for evidence image uploads to finish.");
      return;
    }

    const resolutionImageUrls = resolutionImageUrlsByIssue[issueId] ?? [];
    if (resolutionImageUrls.length === 0) {
      setError("Upload at least one evidence image before submitting resolution.");
      return;
    }

    setActionLoadingId(issueId);
    setError(null);

    try {
      const response = await fetch(`/api/worker/assigned/${issueId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolutionNotes: notes, resolutionImageUrls }),
      });
      const payload = (await response.json()) as WorkerResponse;
      setRequestId(payload.requestId ?? null);

      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to resolve issue.");
        return;
      }

      setNotesByIssue((prev) => ({ ...prev, [issueId]: "" }));
      setResolutionImageUrlsByIssue((prev) => ({ ...prev, [issueId]: [] }));
      setResolutionUploadErrorByIssue((prev) => ({ ...prev, [issueId]: null }));
      await loadAssigned();
    } catch {
      setError("Unable to resolve issue.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const totalAssigned = filteredIssues.filter((issue) => issue.status === "ASSIGNED" || issue.status === "IN_PROGRESS").length;
  const totalCompleted = filteredIssues.filter(
    (issue) => issue.status === "RESOLVED" || issue.status === "AWAITING_HEAD_CLOSURE" || issue.status === "CLOSED"
  ).length;

  const sidebarItems = useMemo(
    () => [
      { id: "overview", label: "Dashboard", icon: LayoutDashboard },
      { id: "assigned_issues", label: "Assigned Issues", icon: ClipboardList, badge: `${totalAssigned}` },
      { id: "submit_resolution", label: "Submit Resolution", icon: Send, badge: `${inProgressIssues.length}` },
      { id: "my_work", label: "My Work", icon: ClipboardList, badge: `${totalCompleted}` },
    ],
    [inProgressIssues.length, totalAssigned, totalCompleted]
  );

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
    await loadAssigned();
  };

  const currentTitle =
    activeView === "overview"
      ? "Worker Dashboard"
      : activeView === "assigned_issues"
        ? "Assigned Issues"
        : activeView === "submit_resolution"
          ? "Resolution Submission"
          : "My Work";

  const currentSubtitle =
    activeView === "overview"
      ? "Overview of your current assignments and progress."
      : activeView === "assigned_issues"
        ? "Review and handle your active maintenance tasks."
        : activeView === "submit_resolution"
          ? "Document completed work and submit final notes."
          : "Review resolved issues and submitted evidence.";

    const profileName = user?.name ?? "Authority Worker";
    const profileEmail = user?.email ?? "worker@civicconnect.local";

  return (
    <div className="h-screen overflow-hidden bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          items={sidebarItems}
          activeView={activeView}
          onSelect={(view) => {
            setActiveView(view as WorkerView);
            setMobileOpen(false);
          }}
          mobileOpen={mobileOpen}
          onOpenMobile={() => setMobileOpen(true)}
          onCloseMobile={() => setMobileOpen(false)}
          portalLabel="Worker Portal"
          helpTitle="Shift Support"
          helpDescription="Need help with assigned maintenance tasks?"
          helpButtonLabel="Contact Supervisor"
          showMobileTrigger={false}
        />

        <div className="min-w-0 flex-1">
          <div className="flex h-screen flex-col overflow-hidden">
            <Navbar
              title={currentTitle}
              subtitle={currentSubtitle}
              searchPlaceholder="Search tasks..."
              searchValue={search}
              onSearchChange={setSearch}
              onRefresh={refreshDashboard}
              isRefreshing={loading}
              refreshLabel="Refresh"
              profileName={profileName}
              profileSubtitle={profileEmail}
              onProfile={() => setActiveView("overview")}
              onSettings={() => setError("Worker settings view is not available yet.")}
              onLogout={logout}
              isLoggingOut={isLoggingOut}
              onToggleMobileMenu={() => setMobileOpen(true)}
              mobileMenuButton={<Menu className="h-4 w-4" />}
            />

            <main className="h-[calc(100vh-4rem)] overflow-y-auto p-4 sm:p-6 lg:p-8">
              <div className="mx-auto w-full max-w-6xl space-y-6">
                {activeView === "overview" ? <WorkerDashboard issues={filteredIssues} onNavigate={setActiveView} /> : null}

                {activeView === "assigned_issues" ? (
                  <AssignedIssues
                    issues={filteredIssues}
                    loading={loading}
                    error={error}
                    requestId={requestId}
                    actionLoadingId={actionLoadingId}
                    onStart={startIssue}
                    onRefresh={loadAssigned}
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
                    resolutionImageUrlsByIssue={resolutionImageUrlsByIssue}
                    resolutionUploadingByIssue={resolutionUploadingByIssue}
                    resolutionUploadErrorByIssue={resolutionUploadErrorByIssue}
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
                    onResolutionImagesChange={(issueId, urls) =>
                      setResolutionImageUrlsByIssue((prev) => ({
                        ...prev,
                        [issueId]: urls,
                      }))
                    }
                    onResolutionUploadingChange={(issueId, uploading) =>
                      setResolutionUploadingByIssue((prev) => ({
                        ...prev,
                        [issueId]: uploading,
                      }))
                    }
                    onResolutionImageError={(issueId, message) =>
                      setResolutionUploadErrorByIssue((prev) => ({
                        ...prev,
                        [issueId]: message,
                      }))
                    }
                    onSubmit={resolveIssue}
                  />
                ) : null}

                {activeView === "my_work" ? (
                  <MyWork issues={filteredIssues} loading={loading} error={error} />
                ) : null}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
