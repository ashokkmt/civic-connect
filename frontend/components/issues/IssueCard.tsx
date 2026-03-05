import Link from "next/link";
import { StatusBadge } from "@/components/issues/StatusBadge";

type IssuePublic = {
  id: string;
  title: string;
  description: string;
  status: string;
  supporterCount?: number;
  createdAt?: string;
};

type IssueCardProps = {
  issue: IssuePublic;
};

export function IssueCard({ issue }: IssueCardProps) {
  return (
    <Link
      href={`/issues/${issue.id}`}
      className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-zinc-900 transition group-hover:text-zinc-950 dark:text-white">
            {issue.title}
          </h3>
          <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">{issue.description}</p>
        </div>
        <StatusBadge status={issue.status} />
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>{issue.supporterCount ?? 0} supporters</span>
        {issue.createdAt ? <span>{new Date(issue.createdAt).toLocaleDateString()}</span> : null}
      </div>
    </Link>
  );
}
