import type { FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import type { DepartmentRow } from "@/components/dashboards/admin/types";

type DepartmentManagementViewProps = {
  departmentRows: DepartmentRow[];
  departmentName: string;
  departmentSaving: boolean;
  departmentMessage: string | null;
  onDepartmentNameChange: (value: string) => void;
  onCreateDepartment: (event: FormEvent<HTMLFormElement>) => void;
  onToggleDepartment: (departmentId: string) => void;
};

export function DepartmentManagementView({
  departmentRows,
  departmentName,
  departmentSaving,
  departmentMessage,
  onDepartmentNameChange,
  onCreateDepartment,
  onToggleDepartment,
}: DepartmentManagementViewProps) {
  const totalDepartments = departmentRows.length;
  const totalIssues = departmentRows.reduce((sum, row) => sum + row.totalIssues, 0);
  const avgSuccessRate =
    totalDepartments === 0
      ? 0
      : Math.round(
          departmentRows.reduce((sum, row) => sum + row.successRate, 0) / totalDepartments
        );

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Total Departments</p>
            <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{totalDepartments}</p>
          </CardBody>
        </Card>
        <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Active Issues</p>
            <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{totalIssues}</p>
          </CardBody>
        </Card>
        <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Avg. Success Rate</p>
            <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{avgSuccessRate}%</p>
          </CardBody>
        </Card>
      </div>

      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <CardBody>
          <form onSubmit={onCreateDepartment} className="space-y-3">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Create New Department</h2>
            <label className="space-y-1 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Department Name</span>
              <input
                value={departmentName}
                onChange={(event) => onDepartmentNameChange(event.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-zinc-800 dark:text-zinc-100"
                placeholder="e.g. Public Works"
              />
            </label>
            {departmentMessage ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{departmentMessage}</p> : null}
            <button
              type="submit"
              disabled={departmentSaving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {departmentSaving ? "Creating..." : "Create Department"}
            </button>
          </form>
        </CardBody>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Department Management</h2>
        <Table variant="slate" headers={["Department Name", "Department Head", "Total Issues", "Resolved Issues", "Success Rate", "Actions"]}>
          {departmentRows.map((row) => (
            <tr key={row.id} className="border-b border-[var(--border)] last:border-0">
              <td className="px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{row.name}</td>
              <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">
                <div className="flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-sky-100 text-[10px] font-semibold text-sky-700 dark:bg-sky-900/40 dark:text-sky-200">
                    {initialsFromName(row.headName)}
                  </span>
                  <span>{row.headName}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">{row.totalIssues}</td>
              <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">{row.resolvedIssues}</td>
              <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div
                      className={`h-full rounded-full ${
                        row.successRate >= 85
                          ? "bg-emerald-500"
                          : row.successRate >= 70
                            ? "bg-amber-500"
                            : "bg-rose-500"
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, row.successRate))}%` }}
                    />
                  </div>
                  <span className="font-semibold">{row.successRate}%</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" className="rounded-md border border-[var(--border)] px-2 py-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
                    View
                  </button>
                  <button type="button" disabled className="rounded-md border border-[var(--border)] px-2 py-1 text-[11px] font-semibold text-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-400">
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleDepartment(row.id)}
                    className="rounded-md border border-[var(--border)] px-2 py-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200"
                  >
                    {row.disabled ? "Enable" : "Disable"}
                  </button>
                  <Badge tone={row.disabled ? "warning" : "success"}>{row.disabled ? "Disabled" : "Active"}</Badge>
                </div>
              </td>
            </tr>
          ))}
          {departmentRows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No departments available yet.
              </td>
            </tr>
          ) : null}
        </Table>
      </div>
    </section>
  );
}

function initialsFromName(name: string) {
  const normalized = name.trim();
  if (!normalized) {
    return "NA";
  }

  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}