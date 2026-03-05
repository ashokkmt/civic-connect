import { headers } from "next/headers";
import { EmptyState } from "@/components/feedback/EmptyState";
import { StatusBadge } from "@/components/issues/StatusBadge";

type IssuePublic = {
  id: string;
  title: string;
  description: string;
  status: string;
  supporterCount?: number;
  createdAt?: string;
  imageUrls?: string[];
};

type IssueResponse = {
  success: boolean;
  data?: { item?: IssuePublic };
  error?: { message?: string };
};

async function getIssue(id: string) {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return { success: false, error: { message: "Host header missing" } } as IssueResponse;
  }

  const response = await fetch(`${protocol}://${host}/api/public/issues/${id}`, {
    method: "GET",
    cache: "no-store",
  });

  return (await response.json()) as IssueResponse;
}

export default async function IssueDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await getIssue(id);
  const issue = payload.data?.item;

  if (!payload.success || !issue) {
    return (
      <EmptyState
        title="Issue not found"
        description={payload.error?.message ?? "Unable to load issue details."}
      />
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Issue detail</p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">{issue.title}</h1>
          <StatusBadge status={issue.status} />
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{issue.description}</p>
      </header>

      <div className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 md:grid-cols-3">
        <div className="space-y-2 md:col-span-2">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Activity</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Supporters: {issue.supporterCount ?? 0}
          </p>
          {issue.createdAt ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Reported: {new Date(issue.createdAt).toLocaleString()}
            </p>
          ) : null}
        </div>
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)] p-4 text-xs text-zinc-500 dark:text-zinc-400">
          Image gallery will appear here when image URLs are available.
        </div>
      </div>
    </section>
  );
}
