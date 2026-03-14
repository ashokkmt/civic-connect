import { ArrowRight, Briefcase, CheckCircle2, ListChecks, PlayCircle } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { StatusBadge } from "@/components/issues/StatusBadge";
import type { WorkerIssue, WorkerView } from "@/components/dashboards/authority-worker/types";

type WorkerDashboardProps = {
  issues: WorkerIssue[];
  onNavigate: (view: WorkerView) => void;
};

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function WorkerDashboard({ issues, onNavigate }: WorkerDashboardProps) {
  const assigned = issues.filter((issue) => issue.status === "ASSIGNED");
  const inProgress = issues.filter((issue) => issue.status === "IN_PROGRESS");
  const resolved = issues.filter((issue) => issue.status === "RESOLVED");
  const activeTasks = issues
    .filter((issue) => issue.status === "ASSIGNED" || issue.status === "IN_PROGRESS")
    .slice(0, 5);

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Assigned</p>
              <Briefcase className="h-5 w-5 text-sky-500" />
            </div>
            <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{issues.length}</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Assigned</p>
              <ListChecks className="h-5 w-5 text-violet-500" />
            </div>
            <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{assigned.length}</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">In Progress</p>
              <PlayCircle className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{inProgress.length}</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Resolved</p>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{resolved.length}</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Current Active Tasks</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Focus queue for your current shift.</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("assigned_issues")}
              className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-[var(--surface-muted)] dark:text-zinc-200"
            >
              Open Assigned Issues
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {activeTasks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--border)] p-6 text-sm text-zinc-600 dark:text-zinc-300">
              No active tasks right now. New assignments will appear here.
            </p>
          ) : (
            <div className="space-y-3">
              {activeTasks.map((task) => (
                <article key={task.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{task.title}</h3>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{task.description}</p>
                      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Assigned: {formatDate(task.createdAt)}</p>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onNavigate("assigned_issues")}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
          >
            Manage Assigned Issues
          </button>
          <button
            type="button"
            onClick={() => onNavigate("submit_resolution")}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-[var(--surface-muted)] dark:text-zinc-200"
          >
            Submit Resolution
          </button>
        </CardBody>
      </Card>
    </section>
  );
}
