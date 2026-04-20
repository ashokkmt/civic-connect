import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { StatusBadge } from "@/components/issues/StatusBadge";
import { formatIssueDisplayId } from "@/lib/issues/displayId";

type IssueHeaderProps = {
  issueId: string;
  title: string;
  description: string;
  status: string;
  backHref: string;
  backLabel?: string;
};

export function IssueHeader({ issueId, title, description, status, backHref, backLabel = "Issues List" }: IssueHeaderProps) {
  return (
    <header className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <Link href={backHref} className="inline-flex items-center gap-1 transition hover:text-zinc-700 dark:hover:text-zinc-200">
          <ChevronLeft className="h-4 w-4" />
          <span>{backLabel}</span>
        </Link>
        <span>/</span>
        <span className="text-xs uppercase tracking-[0.18em]">Details</span>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={status} />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            ID: {formatIssueDisplayId(issueId)}
          </p>
        </div>

        <h1 className="max-w-4xl text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
          {title}
        </h1>

        <p className="max-w-3xl text-sm text-zinc-600 dark:text-zinc-300 sm:text-base">
          {description}
        </p>
      </div>
    </header>
  );
}