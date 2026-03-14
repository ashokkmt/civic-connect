import { BarChart3, CheckCircle2, ClipboardList, Gauge, TimerReset } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import type { HeadIssue, HeadWorkerMetric } from "@/components/dashboards/authority-head/types";

type AnalyticsDashboardProps = {
  issues: HeadIssue[];
  workerMetrics: HeadWorkerMetric[];
  escalationsCount: number;
};

function statByStatus(issues: HeadIssue[], status: string) {
  return issues.filter((issue) => issue.status === status).length;
}

export function AnalyticsDashboard({ issues, workerMetrics, escalationsCount }: AnalyticsDashboardProps) {
  const totalReported = issues.length;
  const approved = statByStatus(issues, "ASSIGNED") + statByStatus(issues, "IN_PROGRESS");
  const inProgress = statByStatus(issues, "IN_PROGRESS");
  const resolved = statByStatus(issues, "RESOLVED") + statByStatus(issues, "AWAITING_HEAD_CLOSURE") + statByStatus(issues, "CLOSED");

  const avgSuccessRate = workerMetrics.length
    ? Math.round(workerMetrics.reduce((sum, item) => sum + item.successRate, 0) / workerMetrics.length)
    : 0;

  const statusBuckets = [
    { label: "Assigned", value: statByStatus(issues, "ASSIGNED") },
    { label: "In Progress", value: inProgress },
    { label: "Resolved", value: statByStatus(issues, "RESOLVED") },
    { label: "Awaiting Closure", value: statByStatus(issues, "AWAITING_HEAD_CLOSURE") },
    { label: "Closed", value: statByStatus(issues, "CLOSED") },
  ];

  const maxBucket = Math.max(...statusBuckets.map((item) => item.value), 1);

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Issues Reported</p>
              <ClipboardList className="h-5 w-5 text-sky-500" />
            </div>
            <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{totalReported}</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Issues Approved</p>
              <CheckCircle2 className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{approved}</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Issues In Progress</p>
              <TimerReset className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{inProgress}</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Issues Resolved</p>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{resolved}</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Worker Success Rate</p>
              <Gauge className="h-5 w-5 text-violet-500" />
            </div>
            <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{avgSuccessRate}%</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Escalations tracked: {escalationsCount}</p>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardBody className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-sky-500" />
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Issue Status Distribution</h2>
            </div>
            <div className="space-y-3">
              {statusBuckets.map((bucket) => (
                <div key={bucket.label}>
                  <div className="mb-1 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{bucket.label}</span>
                    <span>{bucket.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--surface-muted)]">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600"
                      style={{ width: `${Math.max(6, Math.round((bucket.value / maxBucket) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Top Worker Performance</h2>
            <div className="space-y-3">
              {workerMetrics.slice(0, 5).map((worker) => (
                <div key={worker.workerId} className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{worker.workerId}</p>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                    Assigned: {worker.assigned} | Completed: {worker.completed}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">Success: {worker.successRate}%</p>
                </div>
              ))}
              {workerMetrics.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Worker performance data appears once issues are assigned.</p>
              ) : null}
            </div>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
