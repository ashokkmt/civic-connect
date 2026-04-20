import { IssueImageLightbox } from "@/components/issues/IssueImageLightbox";

type ResolutionDetailsProps = {
  resolutionNotes?: string;
  resolutionImageUrls?: string[];
  status: string;
};

export function ResolutionDetails({ resolutionNotes, resolutionImageUrls, status }: ResolutionDetailsProps) {
  const notes = resolutionNotes?.trim() ?? "";
  const hasImages = Boolean(resolutionImageUrls && resolutionImageUrls.length > 0);
  const shouldShow = hasImages || notes.length > 0 || status === "RESOLVED" || status === "AWAITING_HEAD_CLOSURE" || status === "CLOSED";

  if (!shouldShow) {
    return null;
  }

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Work Done</h2>
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Resolution Note</p>
          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-200">{notes || "Resolution note not provided yet."}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Resolution Images</p>
          <div className="mt-2">
            <IssueImageLightbox imageUrls={resolutionImageUrls} thumbnailClassName="h-28 w-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}
