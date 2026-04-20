import { Check, Dot } from "lucide-react";

export type StatusTimelineItem = {
  title: string;
  description: string;
  timestamp?: string;
};

type StatusTimelineProps = {
  items: StatusTimelineItem[];
};

function formatTime(timestamp?: string) {
  if (!timestamp) {
    return "Time unavailable";
  }

  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StatusTimeline({ items }: StatusTimelineProps) {
  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Status History</h2>

      <div className="space-y-4">
        {items.map((item, index) => {
          const last = index === items.length - 1;

          return (
            <div key={`${item.title}-${index}`} className="flex gap-3">
              <div className="flex w-6 flex-col items-center">
                <span className="grid h-6 w-6 place-items-center rounded-full border border-slate-200 bg-slate-50 text-zinc-500 dark:border-slate-700 dark:bg-slate-800 dark:text-zinc-300">
                  {index === 0 ? <Check className="h-3.5 w-3.5" /> : <Dot className="h-4 w-4" />}
                </span>
                {!last ? <span className="mt-1 h-full w-px bg-slate-200 dark:bg-slate-700" /> : null}
              </div>

              <div className="pb-4">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.title}</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{item.description}</p>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{formatTime(item.timestamp)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}