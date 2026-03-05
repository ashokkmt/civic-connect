type StatusBadgeProps = {
  status: string;
};

const STATUS_STYLES: Record<string, string> = {
  PENDING_APPROVAL: "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200",
  ASSIGNED: "bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200",
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
