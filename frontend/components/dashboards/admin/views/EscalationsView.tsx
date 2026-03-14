import { Card, CardBody } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import type { EscalationItem } from "@/components/dashboards/admin/types";

type EscalationsViewProps = {
  escalations: EscalationItem[];
  onLoadEscalations: () => void;
  onResolveEscalation: (issueId: string) => void;
};

export function EscalationsView({ escalations, onLoadEscalations, onResolveEscalation }: EscalationsViewProps) {
  return (
    <section className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">System Escalations</h2>
            <button
              type="button"
              onClick={onLoadEscalations}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-[var(--surface-muted)] dark:text-zinc-200"
            >
              Load Escalations
            </button>
          </div>

          <Table headers={["Issue ID", "Department", "Assigned Head", "Days Pending", "Escalation Status", "Actions"]}>
            {escalations.map((item) => {
              const id = item.id ?? item.issueId ?? "UNKNOWN";
              const level = item.escalationLevel ?? "MEDIUM";
              return (
                <tr key={id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3 text-xs font-semibold text-rose-600 dark:text-rose-300">{id}</td>
                  <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">{item.departmentId ?? "Unknown"}</td>
                  <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">{item.authority?.assignedToWorkerId ?? "Not provided by API"}</td>
                  <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">{daysPending(item.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${byEscalationSeverity(level)}`}>
                      {level}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => onResolveEscalation(id)}
                        className="rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-emerald-500"
                      >
                        Mark Handled
                      </button>
                      <button
                        type="button"
                        disabled
                        className="rounded-md border border-[var(--border)] px-2 py-1 text-[11px] font-semibold text-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-400"
                      >
                        Reassign Dept
                      </button>
                      <button
                        type="button"
                        disabled
                        className="rounded-md border border-[var(--border)] px-2 py-1 text-[11px] font-semibold text-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-400"
                      >
                        Notify Head
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {escalations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  No escalations loaded. Use Load Escalations to fetch current escalated issues.
                </td>
              </tr>
            ) : null}
          </Table>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Reassign department and notify head actions are gated until dedicated backend endpoints are implemented.
          </p>
        </CardBody>
      </Card>
    </section>
  );
}

function daysPending(from?: string) {
  if (!from) {
    return "-";
  }

  const created = new Date(from).getTime();
  if (Number.isNaN(created)) {
    return "-";
  }

  const diffMs = Date.now() - created;
  return Math.max(0, Math.round(diffMs / (24 * 60 * 60 * 1000))).toString();
}

function byEscalationSeverity(level?: string) {
  const normalized = (level ?? "").toUpperCase();
  if (normalized === "CRITICAL") {
    return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300";
  }
  if (normalized === "HIGH") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300";
  }
  return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
}