import Link from "next/link";
import { StatusBadge } from "@/components/issues/StatusBadge";

type IssueRow = {
  id: string;
  title: string;
  status: string;
  createdAt?: string;
  supporterCount?: number;
};

type IssueTableProps = {
  issues: IssueRow[];
  emptyMessage?: string;
};

export function IssueTable({ issues, emptyMessage }: IssueTableProps) {
  if (issues.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-zinc-600 dark:text-zinc-300">
        {emptyMessage ?? "No issues yet."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-[var(--border)] text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          <tr>
            <th className="px-4 py-3">Issue</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Supporters</th>
            <th className="px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr key={issue.id} className="border-b border-[var(--border)] last:border-b-0">
              <td className="px-4 py-3">
                <Link
                  href={`/dashboard/citizen/issues/${issue.id}`}
                  className="font-semibold text-zinc-900 hover:underline dark:text-white"
                >
                  {issue.title}
                </Link>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={issue.status} />
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                {issue.supporterCount ?? 0}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
