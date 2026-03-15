import {
  Activity,
  ArrowRight,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ListChecks,
  PlayCircle,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { WorkerIssue, WorkerView } from "@/components/dashboards/authority-worker/types";

type WorkerDashboardProps = {
  issues: WorkerIssue[];
  onNavigate: (view: WorkerView) => void;
};

export function WorkerDashboard({ issues, onNavigate }: WorkerDashboardProps) {
  const assigned = issues.filter((issue) => issue.status === "ASSIGNED");
  const inProgress = issues.filter((issue) => issue.status === "IN_PROGRESS");
  const resolved = issues.filter((issue) => issue.status === "RESOLVED");
  const activeTasks = issues
    .filter((issue) => issue.status === "ASSIGNED" || issue.status === "IN_PROGRESS")
    .slice(0, 3);

  const currentMonth = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold leading-tight text-slate-900 dark:text-slate-100">Worker Dashboard</h1>
        <p className="text-base text-slate-500 dark:text-slate-400">
          Overview of your current assignments and progress for {currentMonth}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Assigned</span>
            <Briefcase className="h-5 w-5 text-[#1173d4]" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{assigned.length + inProgress.length}</p>
          <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-3.5 w-3.5" />
            +12% from last week
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">In Progress</span>
            <PlayCircle className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{inProgress.length}</p>
          <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-3.5 w-3.5" />
            +2% vs yesterday
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{resolved.length}</p>
          <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
            <TrendingDown className="h-3.5 w-3.5" />
            -5% daily output
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Review</span>
            <ListChecks className="h-5 w-5 text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{Math.max(assigned.length - inProgress.length, 0)}</p>
          <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">Same as last week</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Current Active Tasks</h2>
          <button
            type="button"
            onClick={() => onNavigate("assigned_issues")}
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#1173d4] hover:underline"
          >
            View All Tasks
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {activeTasks.length === 0 ? (
          <p className="p-6 text-sm text-slate-600 dark:text-slate-300">No active tasks right now. New assignments will appear here.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {activeTasks.map((task) => (
              <article
                key={task.id}
                className="flex flex-col justify-between gap-4 p-5 transition-colors hover:bg-slate-50 md:flex-row md:items-center dark:hover:bg-slate-800/50"
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-[#1173d4]/10 p-2.5 text-[#1173d4]">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">{task.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{task.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${
                          task.priority === "HIGH" || task.severity === "HIGH"
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {(task.priority ?? task.severity ?? "NORMAL").toLowerCase()} priority
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-bold uppercase italic ${
                          task.status === "IN_PROGRESS"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        }`}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      onNavigate(task.status === "ASSIGNED" ? "assigned_issues" : "submit_resolution")
                    }
                    className="rounded-lg bg-[#1173d4] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0f66bd]"
                  >
                    {task.status === "ASSIGNED" ? "Start Task" : "Update Status"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="bg-slate-50 p-4 text-center dark:bg-slate-800/30">
          <button
            type="button"
            onClick={() => onNavigate("assigned_issues")}
            className="text-sm font-medium text-slate-500 transition-colors hover:text-[#1173d4] dark:text-slate-400"
          >
            Show More Tasks
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
            <CalendarDays className="h-4 w-4 text-[#1173d4]" />
            Upcoming Schedule
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-l-4 border-[#1173d4] pl-4">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Team Briefing</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Tomorrow, 08:30 AM</p>
              </div>
              <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium dark:bg-slate-800">Room 4B</span>
            </div>
            <div className="flex items-center justify-between border-l-4 border-slate-300 pl-4">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Safety Inspection</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Friday, 02:00 PM</p>
              </div>
              <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium dark:bg-slate-800">West Depot</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
            <Activity className="h-4 w-4 text-[#1173d4]" />
            Completion Rate
          </h3>
          <div className="mb-2 flex items-center justify-between">
            <span className="rounded-full bg-[#1173d4]/10 px-2 py-1 text-xs font-semibold uppercase text-[#1173d4]">
              Goal: 30 Tasks
            </span>
            <span className="text-xs font-semibold text-[#1173d4]">70%</span>
          </div>
          <div className="mb-4 h-2 overflow-hidden rounded bg-[#1173d4]/10">
            <div className="h-full w-[70%] bg-[#1173d4]" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            You are on track. Only {Math.max(30 - resolved.length, 0)} more tasks to reach your monthly goal.
          </p>
        </div>
      </div>
    </section>
  );
}
