import { Trophy } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { WorkerMetricCards } from "@/components/dashboards/authority-head/WorkerMetricCards";
import type { HeadWorkerSummary } from "@/components/dashboards/authority-head/types";

type WorkerAnalyticsProps = {
  workers: HeadWorkerSummary[];
};

export function WorkerAnalytics({ workers }: WorkerAnalyticsProps) {
  const totalWorkers = workers.length;
  const issuesAssigned = workers.reduce((sum, worker) => sum + worker.assigned, 0);
  const issuesResolved = workers.reduce((sum, worker) => sum + worker.completed, 0);
  const issuesPending = workers.reduce((sum, worker) => sum + worker.pending, 0);

  const maxAssigned = Math.max(...workers.map((worker) => worker.assigned), 1);

  return (
    <section className="space-y-8">
      <WorkerMetricCards
        totalWorkers={totalWorkers}
        issuesAssigned={issuesAssigned}
        issuesResolved={issuesResolved}
        issuesPending={issuesPending}
      />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Worker Performance Monitoring</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Top performer rows are highlighted by success rate.</p>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Worker Name</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Assigned Issues</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Resolved Issues</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pending Issues</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Success Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {workers.map((worker, index) => {
                const topPerformer = index < 3 && worker.successRate >= 70;

                return (
                  <tr key={worker.workerId} className={topPerformer ? "bg-emerald-50/70 dark:bg-emerald-950/20" : ""}>
                    <td className="px-6 py-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      <div className="inline-flex items-center gap-2">
                        {topPerformer ? <Trophy className="h-3.5 w-3.5 text-amber-500" /> : null}
                        <span>{worker.workerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-200">{worker.assigned}</td>
                    <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-200">{worker.completed}</td>
                    <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-200">{worker.pending}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600"
                            style={{ width: `${Math.max(8, worker.successRate)}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{worker.successRate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {workers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    Worker analytics become available once workers receive issue assignments.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CardBody className="space-y-3">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Workload Distribution</h2>
          <div className="space-y-2">
            {workers.map((worker) => (
              <div key={`${worker.workerId}-workload`} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300">
                  <span>{worker.workerName}</span>
                  <span>{worker.assigned} assigned</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--surface-muted)]">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                    style={{ width: `${Math.max(5, Math.round((worker.assigned / maxAssigned) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
            {workers.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No worker assignments yet to show distribution.</p>
            ) : null}
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
