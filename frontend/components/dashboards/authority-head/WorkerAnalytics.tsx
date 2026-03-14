import { Trophy } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
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
    <section className="space-y-6">
      <WorkerMetricCards
        totalWorkers={totalWorkers}
        issuesAssigned={issuesAssigned}
        issuesResolved={issuesResolved}
        issuesPending={issuesPending}
      />

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Worker Performance Analytics</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Top performer rows are highlighted by success rate.</p>
          </div>

          <Table
            headers={[
              "Worker Name",
              "Assigned Issues",
              "Resolved Issues",
              "Pending Issues",
              "Success Rate",
            ]}
          >
            {workers.map((worker, index) => {
              const topPerformer = index < 3 && worker.successRate >= 70;

              return (
                <tr
                  key={worker.workerId}
                  className={`border-b border-[var(--border)] last:border-0 ${
                    topPerformer ? "bg-emerald-50/70 dark:bg-emerald-950/20" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    <div className="inline-flex items-center gap-2">
                      {topPerformer ? <Trophy className="h-3.5 w-3.5 text-amber-500" /> : null}
                      <span>{worker.workerName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">{worker.assigned}</td>
                  <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">{worker.completed}</td>
                  <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">{worker.pending}</td>
                  <td className="px-4 py-3">
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
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  Worker analytics become available once workers receive issue assignments.
                </td>
              </tr>
            ) : null}
          </Table>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Workload Distribution</h2>
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
