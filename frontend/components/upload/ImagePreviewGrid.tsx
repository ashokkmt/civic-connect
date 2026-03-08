type ImagePreviewItem = {
  id: string;
  name: string;
  previewUrl: string;
  status: "queued" | "uploading" | "uploaded" | "error";
  progress: number;
  error?: string;
};

type ImagePreviewGridProps = {
  items: ImagePreviewItem[];
  onRemove: (id: string) => void;
};

const statusLabel: Record<ImagePreviewItem["status"], string> = {
  queued: "Queued",
  uploading: "Uploading",
  uploaded: "Uploaded",
  error: "Failed",
};

export function ImagePreviewGrid({ items, onRemove }: ImagePreviewGridProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const isUploaded = item.status === "uploaded";
        const isError = item.status === "error";

        return (
          <article
            key={item.id}
            className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]"
          >
            <div className="aspect-video w-full overflow-hidden bg-black/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.previewUrl}
                alt={item.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="space-y-2 p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="line-clamp-1 text-xs font-semibold text-zinc-700 dark:text-zinc-200">{item.name}</p>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="rounded-md border border-[var(--border)] px-2 py-1 text-[10px] font-semibold text-zinc-600 transition hover:bg-[var(--surface)] dark:text-zinc-300"
                >
                  Remove
                </button>
              </div>

              <div className="space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200/70 dark:bg-zinc-700/60">
                  <div
                    className={`h-full transition-all ${
                      isError ? "bg-red-500" : isUploaded ? "bg-emerald-500" : "bg-sky-500"
                    }`}
                    style={{ width: `${Math.max(0, Math.min(item.progress, 100))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span>{statusLabel[item.status]}</span>
                  <span>{Math.round(item.progress)}%</span>
                </div>
                {item.error ? (
                  <p className="text-[11px] text-red-600 dark:text-red-300">{item.error}</p>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
