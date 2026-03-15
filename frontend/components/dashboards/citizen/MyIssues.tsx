import Link from "next/link";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Badge, toneFromIssueStatus } from "@/components/ui/Badge";
import type { CitizenIssue } from "@/components/dashboards/citizen/types";

type MyIssuesProps = {
  issues: CitizenIssue[];
  loading: boolean;
  error: string | null;
  locationReady: boolean;
};

export function MyIssues({ issues, loading, error, locationReady }: MyIssuesProps) {
  if (!locationReady) {
    return (
      <EmptyState
        title="Location required"
        description="Set your location on the public homepage to view your nearby issue list."
      />
    );
  }

  if (loading) {
    return <div className="h-56 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]" />;
  }

  if (error) {
    return <EmptyState title="Unable to load issues" description={error} />;
  }

  if (issues.length === 0) {
    return <EmptyState title="No issues found" description="You have not reported or supported any nearby issues yet." />;
  }

  const inProgress = issues.filter((issue) => issue.status === "ASSIGNED" || issue.status === "IN_PROGRESS").length;
  const resolved = issues.filter((issue) => issue.status === "RESOLVED" || issue.status === "CLOSED").length;
  const needsAttention = issues.filter((issue) => issue.status === "REJECTED" || issue.status === "PENDING_APPROVAL").length;

  const stats = [
    { label: "Total Filed", value: issues.length, tone: "text-slate-900 dark:text-slate-100" },
    { label: "In Progress", value: inProgress, tone: "text-sky-600 dark:text-sky-400" },
    { label: "Resolved", value: resolved, tone: "text-emerald-600 dark:text-emerald-400" },
    { label: "Needs Attention", value: needsAttention, tone: "text-amber-600 dark:text-amber-400" },
  ] as const;

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">My Issues</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">View and track the status of your reported city concerns</p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold ${stat.tone}`}>{stat.value}</p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <th className="px-6 py-4">Issue ID</th>
                <th className="px-6 py-4">Issue Title</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Supporters</th>
                <th className="px-6 py-4">Last Update</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {issues.map((issue) => (
                <tr
                  key={issue.id}
                  className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-sky-700 dark:text-sky-300">
                    #{issue.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{issue.title}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{issue.departmentId ?? "-"}</td>
                  <td className="px-6 py-4">
                    <Badge tone={toneFromIssueStatus(issue.status)} className="rounded-full text-xs font-bold uppercase tracking-wide">
                      {issue.status.replaceAll("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{issue.supporterCount ?? 0}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                    {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Link
                      href={`/dashboard/citizen/issues/${issue.id}`}
                      className="text-sm font-bold text-sky-700 hover:text-sky-600 dark:text-sky-300"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40">
          <p className="text-sm text-slate-500 dark:text-slate-400">Showing 1 to {Math.min(issues.length, 10)} of {issues.length} results</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="h-8 w-8 rounded-lg border border-slate-200 text-slate-400 dark:border-slate-700"
              aria-label="Previous"
            >
              &lt;
            </button>
            <button
              type="button"
              className="h-8 w-8 rounded-lg bg-sky-600 text-sm font-bold text-white"
              aria-label="Page 1"
            >
              1
            </button>
            <button
              type="button"
              className="h-8 w-8 rounded-lg border border-slate-200 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300"
              aria-label="Page 2"
            >
              2
            </button>
            <button
              type="button"
              className="h-8 w-8 rounded-lg border border-slate-200 text-slate-400 dark:border-slate-700"
              aria-label="Next"
            >
              &gt;
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
