type BadgeTone =
  | "neutral"
  | "info"
  | "warning"
  | "success"
  | "danger"
  | "accent";

type BadgeProps = {
  children: string;
  tone?: BadgeTone;
  className?: string;
};

const TONE_STYLES: Record<BadgeTone, string> = {
  neutral: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
  info: "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
  danger: "bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-200",
  accent: "bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200",
};

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_STYLES[tone]} ${className ?? ""}`}>
      {children}
    </span>
  );
}

export function toneFromIssueStatus(status: string): BadgeTone {
  switch (status) {
    case "PENDING_APPROVAL":
      return "info";
    case "ASSIGNED":
      return "accent";
    case "IN_PROGRESS":
      return "warning";
    case "RESOLVED":
      return "success";
    case "AWAITING_HEAD_CLOSURE":
      return "warning";
    case "REJECTED":
      return "danger";
    case "CLOSED":
      return "neutral";
    default:
      return "neutral";
  }
}
