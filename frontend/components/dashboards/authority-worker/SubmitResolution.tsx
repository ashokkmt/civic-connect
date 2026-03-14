import { Upload } from "lucide-react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { FormError } from "@/components/forms/FormError";
import { Card, CardBody } from "@/components/ui/Card";
import type { WorkerIssue } from "@/components/dashboards/authority-worker/types";

type SubmitResolutionProps = {
  issues: WorkerIssue[];
  selectedIssueId: string | null;
  notesByIssue: Record<string, string>;
  actionLoadingId: string | null;
  error: string | null;
  requestId: string | null;
  onSelectIssue: (issueId: string) => void;
  onNoteChange: (issueId: string, value: string) => void;
  onSubmit: (issueId: string) => Promise<void>;
};

export function SubmitResolution({
  issues,
  selectedIssueId,
  notesByIssue,
  actionLoadingId,
  error,
  requestId,
  onSelectIssue,
  onNoteChange,
  onSubmit,
}: SubmitResolutionProps) {
  const target = issues.find((issue) => issue.id === selectedIssueId) ?? null;

  if (issues.length === 0) {
    return <EmptyState title="No in-progress issues" description="Start a task first, then submit resolution details here." />;
  }

  return (
    <section className="space-y-4">
      <FormError message={error} />
      {requestId ? <p className="text-xs text-zinc-500 dark:text-zinc-400">Request ID: {requestId}</p> : null}

      <Card>
        <CardBody className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Select in-progress issue</span>
              <select
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-400/60 dark:text-zinc-100"
                value={selectedIssueId ?? ""}
                onChange={(event) => onSelectIssue(event.target.value)}
              >
                {issues.map((issue) => (
                  <option key={issue.id} value={issue.id}>
                    {issue.title}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-xs text-zinc-600 dark:text-zinc-300">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">Evidence photos</p>
              <p className="mt-1">Photo attachments for worker resolution are pending backend contract support. UI placeholders are included for the next backend phase.</p>
            </div>
          </div>

          {target ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{target.title}</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{target.description}</p>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Issue ID: {target.id}</p>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              disabled
              className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface-muted)] text-zinc-500 dark:text-zinc-400"
            >
              <Upload className="h-5 w-5" />
              Upload before photo (pending API)
            </button>
            <button
              type="button"
              disabled
              className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface-muted)] text-zinc-500 dark:text-zinc-400"
            >
              <Upload className="h-5 w-5" />
              Upload after photo (pending API)
            </button>
          </div>

          <label className="space-y-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Completion notes</span>
            <textarea
              rows={5}
              value={selectedIssueId ? notesByIssue[selectedIssueId] ?? "" : ""}
              onChange={(event) => {
                if (!selectedIssueId) {
                  return;
                }
                onNoteChange(selectedIssueId, event.target.value);
              }}
              placeholder="Describe the completed work, used materials, and follow-up recommendations."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-400/60 dark:text-zinc-100"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              if (selectedIssueId) {
                void onSubmit(selectedIssueId);
              }
            }}
            disabled={!selectedIssueId || actionLoadingId === selectedIssueId}
            className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900"
          >
            {selectedIssueId && actionLoadingId === selectedIssueId ? "Submitting..." : "Submit Resolution"}
          </button>
        </CardBody>
      </Card>
    </section>
  );
}
