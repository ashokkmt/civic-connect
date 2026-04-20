"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { LoadingSkeleton } from "@/components/feedback/LoadingSkeleton";
import { FormError } from "@/components/forms/FormError";
import { IssueImageLightbox } from "@/components/issues/IssueImageLightbox";
import { formatIssueDisplayId } from "@/lib/issues/displayId";
import type { WorkerIssue } from "@/components/dashboards/authority-worker/types";

type MyWorkProps = {
  issues: WorkerIssue[];
  loading: boolean;
  error: string | null;
};

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString();
}

function isResolvedLike(status: string) {
  return status === "RESOLVED" || status === "AWAITING_HEAD_CLOSURE" || status === "CLOSED";
}

function getAssignedDate(issue: WorkerIssue) {
  return issue.lifecycle?.assignedAt ?? issue.createdAt;
}

function getResolvedDate(issue: WorkerIssue) {
  return issue.authority?.resolvedAt ?? issue.lifecycle?.resolvedAt ?? issue.updatedAt;
}

function hasWorkerResolutionSubmission(issue: WorkerIssue) {
  const notes = issue.authority?.resolutionNotes?.trim() ?? "";
  const imageCount = issue.authority?.resolutionImageUrls?.length ?? issue.resolutionImageUrls?.length ?? 0;
  return Boolean(getResolvedDate(issue) || notes || imageCount > 0);
}

export function MyWork({ issues, loading, error }: MyWorkProps) {
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const completed = useMemo(
    () =>
      issues
        .filter((issue) => isResolvedLike(issue.status) && hasWorkerResolutionSubmission(issue))
    .sort((a, b) => {
      const aTime = new Date(getResolvedDate(a) ?? "").getTime() || 0;
      const bTime = new Date(getResolvedDate(b) ?? "").getTime() || 0;
      return bTime - aTime;
    }),
    [issues]
  );

  const selectedIssue = completed.find((issue) => issue.id === selectedIssueId) ?? null;

  if (loading) {
    return <LoadingSkeleton label="Loading completed issues" />;
  }

  return (
    <section className="space-y-6">
      <FormError message={error} />

      {completed.length === 0 ? (
        <EmptyState title="No completed issues" description="Resolved work will appear here after submission." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Issue ID</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Title</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date Assigned</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date Resolved</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {completed.map((issue) => (
                <tr
                  key={issue.id}
                  onClick={() => setSelectedIssueId(issue.id)}
                  className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <td className="px-6 py-4 text-sm font-semibold text-sky-700 dark:text-sky-300">{formatIssueDisplayId(issue.id)}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{issue.title}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {issue.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{formatDate(getAssignedDate(issue))}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{formatDate(getResolvedDate(issue))}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedIssueId(issue.id);
                      }}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedIssue ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close details"
            className="absolute inset-0 bg-black/45"
            onClick={() => setSelectedIssueId(null)}
          />
          <section className="relative z-10 w-full max-w-3xl space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <header className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Resolution Details</p>
                <h3 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{selectedIssue.title}</h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{formatIssueDisplayId(selectedIssue.id)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIssueId(null)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Resolution Note</p>
                <p className="text-sm text-zinc-700 dark:text-zinc-200">{selectedIssue.authority?.resolutionNotes?.trim() || "No resolution note provided."}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Submission Timestamp</p>
                <p className="text-sm text-zinc-700 dark:text-zinc-200">{formatDate(getResolvedDate(selectedIssue))}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Uploaded Images</p>
              <IssueImageLightbox
                imageUrls={selectedIssue.authority?.resolutionImageUrls ?? selectedIssue.resolutionImageUrls}
                thumbnailClassName="h-28 w-full object-cover"
                gridClassName="grid grid-cols-2 gap-2"
              />
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
