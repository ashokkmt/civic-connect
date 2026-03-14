import type { FormEvent } from "react";
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
  return (
    <section className="space-y-6">
      <Card>
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

      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Department Management</h2>
          <Table headers={["Department Name", "Department Head", "Total Issues", "Resolved Issues", "Success Rate", "Actions"]}>
            {departmentRows.map((row) => (
              <tr key={row.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{row.name}</td>
                <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">{row.headName}</td>
                <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">{row.totalIssues}</td>
                <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">{row.resolvedIssues}</td>
                <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">{row.successRate}%</td>
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
        </CardBody>
      </Card>
    </section>
  );
}