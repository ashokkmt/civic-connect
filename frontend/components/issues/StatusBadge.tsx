type StatusBadgeProps = {
  status: string;
};

const STATUS_STYLES: Record<string, string> = {
  PENDING_APPROVAL: "border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/30 dark:text-amber-200",
  ASSIGNED: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  IN_PROGRESS: "bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
  AWAITING_HEAD_CLOSURE: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
  CLOSED: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
  REJECTED: "bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-200",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${style}`}>{status}</span>
  );
}
