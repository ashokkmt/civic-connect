import { CheckCircle2, ClipboardList, TimerReset, Users2 } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";

type WorkerMetricCardsProps = {
  totalWorkers: number;
  issuesAssigned: number;
  issuesResolved: number;
  issuesPending: number;
};

export function WorkerMetricCards({
  totalWorkers,
  issuesAssigned,
  issuesResolved,
  issuesPending,
}: WorkerMetricCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Workers</p>
            <Users2 className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{totalWorkers}</p>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Issues Assigned</p>
            <ClipboardList className="h-5 w-5 text-sky-600" />
          </div>
          <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{issuesAssigned}</p>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Issues Resolved</p>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{issuesResolved}</p>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Issues Pending</p>
            <TimerReset className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{issuesPending}</p>
        </CardBody>
      </Card>
    </div>
  );
}
