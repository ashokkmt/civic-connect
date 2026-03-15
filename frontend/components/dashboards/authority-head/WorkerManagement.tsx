import { useMemo, useState } from "react";
import { Eye, Plus, Search } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { FormError } from "@/components/forms/FormError";
import { WorkerMetricCards } from "@/components/dashboards/authority-head/WorkerMetricCards";
import type { HeadIssue, HeadWorkerStatus, HeadWorkerSummary } from "@/components/dashboards/authority-head/types";

type WorkerManagementProps = {
  pendingIssues: HeadIssue[];
  workers: HeadWorkerSummary[];
  createWorkerLoading: boolean;
  createWorkerError: string | null;
  createWorkerSuccess: string | null;
  onCreateWorker: (email: string, password: string) => Promise<void>;
  onQuickAssignApprove: (issueId: string, workerId: string, severity: string) => Promise<void>;
};

export function WorkerManagement({
  pendingIssues,
  workers,
  createWorkerLoading,
  createWorkerError,
  createWorkerSuccess,
  onCreateWorker,
  onQuickAssignApprove,
}: WorkerManagementProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [selectedIssueId, setSelectedIssueId] = useState("");
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [severity, setSeverity] = useState("MEDIUM");
  const [assignError, setAssignError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | HeadWorkerStatus>("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<HeadWorkerSummary | null>(null);

  const assignableIssues = useMemo(
    () => pendingIssues.filter((issue) => issue.status === "PENDING_APPROVAL"),
    [pendingIssues]
  );

  const filteredWorkers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return workers.filter((worker) => {
      if (statusFilter !== "ALL" && worker.status !== statusFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        worker.workerName.toLowerCase().includes(query) ||
        worker.email.toLowerCase().includes(query) ||
        worker.workerId.toLowerCase().includes(query)
      );
    });
  }, [search, statusFilter, workers]);

  const totalWorkers = workers.length;
  const issuesAssigned = workers.reduce((sum, worker) => sum + worker.assigned, 0);
  const issuesResolved = workers.reduce((sum, worker) => sum + worker.completed, 0);
  const issuesPending = workers.reduce((sum, worker) => sum + worker.pending, 0);

  const submitWorker = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onCreateWorker(email, password);
    setEmail("");
    setPassword("");
  };

  const submitAssign = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAssignError(null);

    if (!selectedIssueId || !selectedWorkerId || !severity.trim()) {
      setAssignError("Issue, worker ID, and severity are required.");
      return;
    }

    await onQuickAssignApprove(selectedIssueId, selectedWorkerId, severity.trim());
  };

  return (
    <section className="space-y-6">
      <WorkerMetricCards
        totalWorkers={totalWorkers}
        issuesAssigned={issuesAssigned}
        issuesResolved={issuesResolved}
        issuesPending={issuesPending}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Create New Worker</h2>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Use the worker registration flow scoped to your department.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create Worker
                </button>
              </div>
              <FormError message={createWorkerError} />
              {createWorkerSuccess ? <p className="text-xs text-emerald-600 dark:text-emerald-300">{createWorkerSuccess}</p> : null}
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Profile edit, disable, and delete actions require backend worker-management APIs and are currently read-only actions.
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardBody>
            <form className="space-y-3" onSubmit={submitAssign}>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Assign Pending Issue</h2>
              <label className="space-y-1 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Pending issue</span>
                <select
                  value={selectedIssueId}
                  onChange={(event) => setSelectedIssueId(event.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-zinc-800 dark:text-zinc-100"
                >
                  <option value="">Select issue</option>
                  {assignableIssues.map((issue) => (
                    <option key={issue.id} value={issue.id}>
                      {issue.id} - {issue.title}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Worker ID</span>
                  <input
                    value={selectedWorkerId}
                    onChange={(event) => setSelectedWorkerId(event.target.value)}
                    placeholder="Worker Mongo ID"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-zinc-800 dark:text-zinc-100"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Severity</span>
                  <input
                    value={severity}
                    onChange={(event) => setSeverity(event.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-zinc-800 dark:text-zinc-100"
                  />
                </label>
              </div>
              <FormError message={assignError} />
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
              >
                Approve & Assign
              </button>
            </form>
          </CardBody>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Worker Directory</h2>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search workers"
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] py-2 pl-8 pr-3 text-xs text-zinc-800 dark:text-zinc-100"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "ALL" | HeadWorkerStatus)}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-zinc-800 dark:text-zinc-100"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="IDLE">Idle</option>
              <option value="DISABLED">Disabled</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Worker Name</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Assigned Issues</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Last Active</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredWorkers.map((worker) => (
                <tr key={worker.workerId}>
                  <td className="px-6 py-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{worker.workerName}</td>
                  <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-200">{worker.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${
                        worker.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : worker.status === "IDLE"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                            : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      {worker.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-200">{worker.assigned}</td>
                  <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-300">
                    {worker.lastActiveAt ? new Date(worker.lastActiveAt).toLocaleString() : "No recent activity"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedWorker(worker)}
                        className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-1 text-[11px] font-semibold text-zinc-700 transition hover:bg-[var(--surface-muted)] dark:text-zinc-200"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </button>
                      <button
                        type="button"
                        disabled
                        className="rounded-md border border-[var(--border)] px-2 py-1 text-[11px] font-semibold text-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-400"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled
                        className="rounded-md border border-[var(--border)] px-2 py-1 text-[11px] font-semibold text-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-400"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        disabled
                        className="rounded-md border border-[var(--border)] px-2 py-1 text-[11px] font-semibold text-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-400"
                      >
                        Disable
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    No workers match your current search and status filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Create Worker Account</h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Registers a department worker via the head worker endpoint.</p>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-md border border-[var(--border)] px-2 py-1 text-xs text-zinc-600 dark:text-zinc-300"
              >
                Close
              </button>
            </div>
            <form className="space-y-3" onSubmit={submitWorker}>
              <label className="space-y-1 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Email</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-zinc-800 dark:text-zinc-100"
                  required
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Password</span>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-zinc-800 dark:text-zinc-100"
                  required
                />
              </label>
              <FormError message={createWorkerError} />
              {createWorkerSuccess ? <p className="text-xs text-emerald-600 dark:text-emerald-300">{createWorkerSuccess}</p> : null}
              <button
                type="submit"
                disabled={createWorkerLoading}
                className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900"
              >
                {createWorkerLoading ? "Creating..." : "Create Worker"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {selectedWorker ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Worker Profile</h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Derived profile from available issue assignment data.</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWorker(null)}
                className="rounded-md border border-[var(--border)] px-2 py-1 text-xs text-zinc-600 dark:text-zinc-300"
              >
                Close
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <p className="text-sm text-zinc-700 dark:text-zinc-200">
                <span className="mr-1 text-xs uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Name</span>
                {selectedWorker.workerName}
              </p>
              <p className="text-sm text-zinc-700 dark:text-zinc-200">
                <span className="mr-1 text-xs uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Email</span>
                {selectedWorker.email}
              </p>
              <p className="text-sm text-zinc-700 dark:text-zinc-200">
                <span className="mr-1 text-xs uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Status</span>
                {selectedWorker.status}
              </p>
              <p className="text-sm text-zinc-700 dark:text-zinc-200">
                <span className="mr-1 text-xs uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Last Active</span>
                {selectedWorker.lastActiveAt ? new Date(selectedWorker.lastActiveAt).toLocaleString() : "Not available"}
              </p>
              <p className="text-sm text-zinc-700 dark:text-zinc-200">
                <span className="mr-1 text-xs uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Assigned</span>
                {selectedWorker.assigned}
              </p>
              <p className="text-sm text-zinc-700 dark:text-zinc-200">
                <span className="mr-1 text-xs uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Resolved</span>
                {selectedWorker.completed}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
