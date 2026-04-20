import { Fragment, useState } from "react";
import { AlertTriangle, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { IssueImageLightbox } from "@/components/issues/IssueImageLightbox";
import type { DepartmentRow, EscalationItem } from "@/components/dashboards/admin/types";
import { formatIssueDisplayId } from "@/lib/issues/displayId";

type EscalationsViewProps = {
  escalations: EscalationItem[];
  departments: DepartmentRow[];
  reassignLoadingId: string | null;
  notifyLoadingId: string | null;
  onLoadEscalations: () => void;
  onResolveEscalation: (issueId: string) => void;
  onReassignDepartment: (issueId: string, departmentId: string) => void;
  onNotifyHead: (issueId: string) => void;
};

export function EscalationsView({
  escalations,
  departments,
  reassignLoadingId,
  notifyLoadingId,
  onLoadEscalations,
  onResolveEscalation,
  onReassignDepartment,
  onNotifyHead,
}: EscalationsViewProps) {
  const [departmentSelections, setDepartmentSelections] = useState<Record<string, string>>({});
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);

  const totalEscalations = escalations.length;
  const avgPendingDays =
    totalEscalations === 0
      ? 0
      : Math.round(
          escalations.reduce((sum, item) => sum + Number(daysPending(item.createdAt)), 0) /
            totalEscalations
        );

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Total Escalations</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{totalEscalations}</p>
            </div>
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
              <AlertTriangle className="h-6 w-6" />
            </span>
          </CardBody>
        </Card>

        <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Average Pending</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{avgPendingDays} Days</p>
            </div>
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              <Clock3 className="h-6 w-6" />
            </span>
          </CardBody>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">System Escalations</h2>
          <button
            type="button"
            onClick={onLoadEscalations}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-[var(--surface-muted)] dark:text-zinc-200"
          >
            Load Escalations
          </button>
        </div>

        <Table variant="slate" headers={["Issue ID", "Department", "Assigned Head", "Days Pending", "Escalation Status", "Actions"]}>
          {escalations.map((item) => {
            const id = item.id ?? item.issueId ?? "UNKNOWN";
            const level = item.escalationLevel;
            const normalizedLevel = typeof level === "string" ? level.toUpperCase() : "";
            const levelLabel = typeof level === "number" ? `LEVEL ${level}` : normalizedLevel || "MEDIUM";
            return (
              <Fragment key={id}>
                <tr className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3 text-xs font-semibold text-rose-600 dark:text-rose-300">{formatIssueDisplayId(id)}</td>
                  <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">{item.departmentId ?? "Unknown"}</td>
                  <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">{item.authority?.assignedToWorkerId ?? "Not provided by API"}</td>
                  <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">
                    <Badge tone="warning">{`${daysPending(item.createdAt)} Days`}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={byEscalationSeverity(level)}>{levelLabel}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setExpandedIssueId((prev) => (prev === id ? null : id))}
                        className="rounded-md border border-[var(--border)] px-2 py-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200"
                      >
                        {expandedIssueId === id ? "Hide Details" : "View Details"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onResolveEscalation(id)}
                        className="rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-emerald-500"
                      >
                        Mark Handled
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const departmentId = departmentSelections[id] || item.departmentId || "";
                          if (!departmentId) {
                            return;
                          }
                          onReassignDepartment(id, departmentId);
                        }}
                        disabled={reassignLoadingId === id || !(departmentSelections[id] || item.departmentId)}
                        className="rounded-md border border-[var(--border)] px-2 py-1 text-[11px] font-semibold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-200"
                      >
                        {reassignLoadingId === id ? "Reassigning..." : "Reassign Dept"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onNotifyHead(id)}
                        disabled={notifyLoadingId === id}
                        className="rounded-md border border-[var(--border)] px-2 py-1 text-[11px] font-semibold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-200"
                      >
                        {notifyLoadingId === id ? "Notifying..." : "Notify Head"}
                      </button>
                      <select
                        value={departmentSelections[id] ?? item.departmentId ?? ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          setDepartmentSelections((prev) => ({ ...prev, [id]: value }));
                        }}
                        className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1 text-[11px] text-zinc-700 dark:text-zinc-200"
                      >
                        <option value="">Select department</option>
                        {departments.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
                {expandedIssueId === id ? (
                  <tr>
                    <td colSpan={6} className="bg-[var(--surface-muted)] px-4 py-4">
                      <div className="grid gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 lg:grid-cols-[2fr_1fr]">
                        <div className="space-y-3">
                          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{item.title ?? id}</h3>
                          <p className="text-sm text-zinc-600 dark:text-zinc-300">{item.description ?? "No description provided."}</p>
                          <div className="grid gap-2 text-xs text-zinc-600 dark:text-zinc-300 sm:grid-cols-2">
                            <p>Status: {item.status ?? "Unknown"}</p>
                            <p>Support Count: {item.supporterCount ?? 0}</p>
                            <p>Issue ID: {formatIssueDisplayId(id)}</p>
                            {item.location?.coordinates ? (
                              <p>
                                Location: {item.location.coordinates[1]?.toFixed(4)}, {item.location.coordinates[0]?.toFixed(4)}
                              </p>
                            ) : (
                              <p>Location: Not available</p>
                            )}
                            <p>{item.createdAt ? `Reported: ${new Date(item.createdAt).toLocaleString()}` : "Reported: Not available"}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Issue images</p>
                          <IssueImageLightbox imageUrls={item.imageUrls} thumbnailClassName="h-28 w-full object-cover" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
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

        <p className="text-xs text-zinc-500 dark:text-zinc-400">Escalation actions are live and persist through admin governance APIs.</p>
      </div>
    </section>
  );
}

function daysPending(from?: string) {
  if (!from) {
    return "0";
  }

  const created = new Date(from).getTime();
  if (Number.isNaN(created)) {
    return "0";
  }

  const diffMs = Date.now() - created;
  return Math.max(0, Math.round(diffMs / (24 * 60 * 60 * 1000))).toString();
}

function byEscalationSeverity(level?: string | number) {
  const normalized = typeof level === "string" ? level.toUpperCase() : "";
  if (normalized === "CRITICAL") {
    return "danger" as const;
  }
  if (normalized === "HIGH") {
    return "warning" as const;
  }
  return "neutral" as const;
}