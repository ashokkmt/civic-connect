import { useState } from "react";
import { FormError } from "@/components/forms/FormError";
import { StatusBadge } from "@/components/issues/StatusBadge";
import { Card, CardBody } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import type { HeadIssue } from "@/components/dashboards/authority-head/types";

type ResolvedIssuesEscalationsProps = {
  issues: HeadIssue[];
  escalations: HeadIssue[];
  closeLoadingId: string | null;
  reassignLoadingId: string | null;
  onCloseIssue: (issueId: string) => Promise<void>;
  onReassignIssue: (issueId: string, workerId: string) => Promise<void>;
  mode: "resolved" | "escalations";
};

function dateLabel(value?: string) {
  if (!value) {
    return "-";
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
}

export function ResolvedIssuesEscalations({
  issues,
  escalations,
  closeLoadingId,
  reassignLoadingId,
  onCloseIssue,
  onReassignIssue,
  mode,
}: ResolvedIssuesEscalationsProps) {
  const [reassignWorkerByIssue, setReassignWorkerByIssue] = useState<Record<string, string>>({});
  const [localError, setLocalError] = useState<string | null>(null);

  const resolvedLike = issues.filter(
    (issue) => issue.status === "RESOLVED" || issue.status === "AWAITING_HEAD_CLOSURE" || issue.status === "CLOSED"
  );

  return (
    <section className="space-y-6">
      <FormError message={localError} />

      {mode === "resolved" ? (
        <Card>
          <CardBody className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Resolved & Confirmation Queue</h2>
            <Table headers={["Issue ID", "Assigned Worker", "Completion Date", "Confirmation Status", "Action"]}>
              {resolvedLike.map((issue) => (
                <tr key={issue.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3 text-xs font-semibold text-blue-600 dark:text-blue-300">{issue.id}</td>
                  <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">{issue.authority?.assignedToWorkerId ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">{dateLabel(issue.authority?.resolvedAt ?? issue.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={issue.status} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => void onCloseIssue(issue.id)}
                      disabled={issue.status !== "AWAITING_HEAD_CLOSURE" || closeLoadingId === issue.id}
                      className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-200"
                    >
                      {closeLoadingId === issue.id ? "Closing..." : "Close Issue"}
                    </button>
                  </td>
                </tr>
              ))}
              {resolvedLike.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    No resolved issues are available yet.
                  </td>
                </tr>
              ) : null}
            </Table>
          </CardBody>
        </Card>
      ) : null}

      {mode === "escalations" ? (
        <Card>
          <CardBody className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Escalated Issues</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Escalate-to-admin write action is not available in current API surface.</p>
            </div>

            <Table headers={["Issue ID", "Status", "Assigned Worker", "Reassign Worker ID", "Action"]}>
              {escalations.map((issue) => (
                <tr key={issue.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3 text-xs font-semibold text-rose-600 dark:text-rose-300">{issue.id}</td>
                  <td className="px-4 py-3"><StatusBadge status={issue.status} /></td>
                  <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">{issue.authority?.assignedToWorkerId ?? "-"}</td>
                  <td className="px-4 py-3">
                    <input
                      value={reassignWorkerByIssue[issue.id] ?? ""}
                      onChange={(event) =>
                        setReassignWorkerByIssue((prev) => ({
                          ...prev,
                          [issue.id]: event.target.value,
                        }))
                      }
                      placeholder="Worker ID"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1.5 text-xs text-zinc-800 dark:text-zinc-100"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        const workerId = (reassignWorkerByIssue[issue.id] ?? "").trim();
                        if (!workerId) {
                          setLocalError("Worker ID is required to reassign escalated issue.");
                          return;
                        }
                        setLocalError(null);
                        void onReassignIssue(issue.id, workerId);
                      }}
                      disabled={reassignLoadingId === issue.id}
                      className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {reassignLoadingId === issue.id ? "Reassigning..." : "Reassign"}
                    </button>
                  </td>
                </tr>
              ))}
              {escalations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    No escalations reported by backend.
                  </td>
                </tr>
              ) : null}
            </Table>
          </CardBody>
        </Card>
      ) : null}
    </section>
  );
}
