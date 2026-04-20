import { CheckCircle2, Clock3, Send } from "lucide-react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { FormError } from "@/components/forms/FormError";
import { ImageUploader } from "@/components/upload/ImageUploader";
import type { WorkerIssue } from "@/components/dashboards/authority-worker/types";
import { formatIssueDisplayId } from "@/lib/issues/displayId";

type SubmitResolutionProps = {
  issues: WorkerIssue[];
  selectedIssueId: string | null;
  notesByIssue: Record<string, string>;
  resolutionImageUrlsByIssue: Record<string, string[]>;
  resolutionUploadingByIssue: Record<string, boolean>;
  resolutionUploadErrorByIssue: Record<string, string | null>;
  actionLoadingId: string | null;
  error: string | null;
  requestId: string | null;
  onSelectIssue: (issueId: string) => void;
  onNoteChange: (issueId: string, value: string) => void;
  onResolutionImagesChange: (issueId: string, urls: string[]) => void;
  onResolutionUploadingChange: (issueId: string, uploading: boolean) => void;
  onResolutionImageError: (issueId: string, message: string | null) => void;
  onSubmit: (issueId: string) => Promise<void>;
};

export function SubmitResolution({
  issues,
  selectedIssueId,
  notesByIssue,
  resolutionImageUrlsByIssue,
  resolutionUploadingByIssue,
  resolutionUploadErrorByIssue,
  actionLoadingId,
  error,
  requestId,
  onSelectIssue,
  onNoteChange,
  onResolutionImagesChange,
  onResolutionUploadingChange,
  onResolutionImageError,
  onSubmit,
}: SubmitResolutionProps) {
  const selectedIssue = issues.find((issue) => issue.id === selectedIssueId) ?? null;

  const target = issues.find((issue) => issue.id === selectedIssueId) ?? null;

  if (issues.length === 0) {
    return <EmptyState title="No in-progress issues" description="Start a task first, then submit resolution details here." />;
  }

  return (
    <section className="mx-auto w-full max-w-[520px] space-y-6">
      <FormError message={error} />
      {requestId ? <p className="text-xs text-zinc-500 dark:text-zinc-400">Request ID: {requestId}</p> : null}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-[#1173d4]/20 bg-[#1173d4]/10 text-xs font-bold text-[#1173d4]">
              AW
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">Authority Worker</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{selectedIssue ? `Issue ${formatIssueDisplayId(selectedIssue.id)}` : "Issue selected"}</p>
            </div>
          </div>
          <span className="rounded-full bg-[#1173d4]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#1173d4]">
            On Duty
          </span>
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Please document the resolution for this active ticket and submit final notes.
      </p>

      <div className="space-y-5">
        <label className="space-y-2 text-sm">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Select In-Progress Issue</span>
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-[#1173d4] focus:ring-1 focus:ring-[#1173d4] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            value={selectedIssueId ?? ""}
            onChange={(event) => onSelectIssue(event.target.value)}
          >
            {issues.map((issue) => (
              <option key={issue.id} value={issue.id}>
                {`${formatIssueDisplayId(issue.id)} - ${issue.title}`}
              </option>
            ))}
          </select>
        </label>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100">Evidence Photos</h3>
          <div className="mt-4">
            <ImageUploader
              value={selectedIssueId ? resolutionImageUrlsByIssue[selectedIssueId] ?? [] : []}
              onChange={(urls) => {
                if (selectedIssueId) {
                  onResolutionImagesChange(selectedIssueId, urls);
                }
              }}
              onUploadingChange={(uploading) => {
                if (selectedIssueId) {
                  onResolutionUploadingChange(selectedIssueId, uploading);
                }
              }}
              onError={(message) => {
                if (selectedIssueId) {
                  onResolutionImageError(selectedIssueId, message);
                }
              }}
            />
            {selectedIssueId && resolutionUploadErrorByIssue[selectedIssueId] ? (
              <p className="mt-2 text-xs text-red-600 dark:text-red-300">{resolutionUploadErrorByIssue[selectedIssueId]}</p>
            ) : null}
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Upload at least one clear proof image before submitting resolution.</p>
          </div>
        </div>

        {target ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{target.title}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{target.description}</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Issue ID: {formatIssueDisplayId(target.id)}</p>
          </div>
        ) : null}

        <label className="space-y-2 text-sm">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Completion Notes</span>
          <textarea
            rows={5}
            value={selectedIssueId ? notesByIssue[selectedIssueId] ?? "" : ""}
            onChange={(event) => {
              if (!selectedIssueId) {
                return;
              }
              onNoteChange(selectedIssueId, event.target.value);
            }}
            placeholder="Describe the work completed, materials used, and any follow-up required..."
            className="min-h-[120px] w-full rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#1173d4] focus:ring-1 focus:ring-[#1173d4] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-600"
          />
        </label>

        <div className="space-y-2">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Resolution Status</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-lg border-2 border-[#1173d4] bg-[#1173d4]/5 p-3 text-sm font-bold text-[#1173d4]"
            >
              <CheckCircle2 className="h-4 w-4" />
              Resolved
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
            >
              <Clock3 className="h-4 w-4" />
              Partial
            </button>
          </div>
        </div>

        <div className="pb-4 pt-1">
          <button
            type="button"
            onClick={() => {
              if (selectedIssueId) {
                void onSubmit(selectedIssueId);
              }
            }}
            disabled={
              !selectedIssueId ||
              actionLoadingId === selectedIssueId ||
              (selectedIssueId ? resolutionUploadingByIssue[selectedIssueId] === true : false)
            }
            className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#1173d4] text-lg font-bold text-white shadow-lg shadow-[#1173d4]/25 transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-5 w-5" />
            {selectedIssueId && resolutionUploadingByIssue[selectedIssueId]
              ? "Uploading evidence..."
              : selectedIssueId && actionLoadingId === selectedIssueId
                ? "Submitting..."
                : "Submit Resolution"}
          </button>
          <p className="mt-4 text-center text-xs text-slate-400">
            By submitting, you confirm that all information provided is accurate and the task has been completed according to safety standards.
          </p>
        </div>
      </div>
    </section>
  );
}
