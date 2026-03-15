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
  const awaitingClosure = statByStatus(issues, "AWAITING_HEAD_CLOSURE");

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
    <section className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Total Reported</p>
              <ClipboardList className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">{totalReported}</p>
          </CardBody>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Approved</p>
              <CheckCircle2 className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">{approved}</p>
          </CardBody>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">In Progress</p>
              <TimerReset className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">{inProgress}</p>
          </CardBody>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Resolved</p>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">{resolved}</p>
          </CardBody>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Worker Success Rate</p>
              <Gauge className="h-5 w-5 text-sky-500" />
            </div>
            <p className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">{avgSuccessRate}%</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Escalations tracked: {escalationsCount}</p>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-2">
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

        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Top Worker Performance</h2>
            <div className="space-y-3">
              {workerMetrics.slice(0, 5).map((worker) => (
                <div key={worker.workerId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-slate-100">
                    <span>{worker.workerId}</span>
                    <span>{worker.successRate}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full bg-[#1173d4]" style={{ width: `${Math.max(5, worker.successRate)}%` }} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Assigned {worker.assigned} • Completed {worker.completed}</p>
                </div>
              ))}
              {workerMetrics.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Worker performance data appears once issues are assigned.</p>
              ) : null}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Optimization Suggestion</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                Prioritize issues awaiting closure ({awaitingClosure}) to improve citizen confirmation throughput.
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="flex items-start gap-3">
            <div className="rounded-lg bg-red-100 p-2 text-red-700 dark:bg-red-900/30 dark:text-red-300">
              <TimerReset className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">Critical Escalations</h3>
              <p className="mt-1 text-sm text-red-700/90 dark:text-red-300/90">
                {escalationsCount} escalated issues currently need active reassignment or manual intervention.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
