import type { FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import type { DepartmentRow, HeadRow } from "@/components/dashboards/admin/types";

type HeadRegistrationViewProps = {
  headRows: HeadRow[];
  departments: DepartmentRow[];
  headName: string;
  headEmail: string;
  headPassword: string;
  headDepartmentId: string;
  headSaving: boolean;
  headMessage: string | null;
  onHeadNameChange: (value: string) => void;
  onHeadEmailChange: (value: string) => void;
  onHeadPasswordChange: (value: string) => void;
  onHeadDepartmentChange: (value: string) => void;
  onRegisterHead: (event: FormEvent<HTMLFormElement>) => void;
};

export function HeadRegistrationView({
  headRows,
  departments,
  headName,
  headEmail,
  headPassword,
  headDepartmentId,
  headSaving,
  headMessage,
  onHeadNameChange,
  onHeadEmailChange,
  onHeadPasswordChange,
  onHeadDepartmentChange,
  onRegisterHead,
}: HeadRegistrationViewProps) {
  return (
    <section className="space-y-6">
      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <CardBody>
          <form onSubmit={onRegisterHead} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Name</p>
              <input
                value={headName}
                onChange={(event) => onHeadNameChange(event.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-zinc-800 dark:text-zinc-100"
                placeholder="Department head name"
              />
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Email</p>
              <input
                value={headEmail}
                onChange={(event) => onHeadEmailChange(event.target.value)}
                type="email"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-zinc-800 dark:text-zinc-100"
                placeholder="head@city.gov"
              />
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Department Assignment</p>
              <select
                value={headDepartmentId}
                onChange={(event) => onHeadDepartmentChange(event.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-zinc-800 dark:text-zinc-100"
              >
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Password</p>
              <input
                value={headPassword}
                onChange={(event) => onHeadPasswordChange(event.target.value)}
                type="password"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-zinc-800 dark:text-zinc-100"
                placeholder="Temporary password"
              />
            </div>
            <div className="sm:col-span-2">
              <div className="mb-3 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300">
                Registered department heads receive account activation details and can immediately manage issue workflows.
              </div>
              {headMessage ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{headMessage}</p> : null}
              <button
                type="submit"
                disabled={headSaving}
                className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {headSaving ? "Registering..." : "Register Department Head"}
              </button>
            </div>
          </form>
        </CardBody>
      </Card>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Registered Department Heads</h2>
          <Badge tone="info">{headRows.length} registered</Badge>
        </div>
        <Table variant="slate" headers={["Name", "Email", "Department Assignment"]}>
          {headRows.map((head) => (
            <tr key={head.id} className="border-b border-[var(--border)] last:border-0">
              <td className="px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{head.name}</td>
              <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">{head.email}</td>
              <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">{departmentNameById(head.departmentId, departments)}</td>
            </tr>
          ))}
          {headRows.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No heads have been registered in this session yet.
              </td>
            </tr>
          ) : null}
        </Table>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          The backend currently accepts email/password/departmentId for head creation. Name persistence is tracked as a backend sync task.
        </p>
      </div>
    </section>
  );
}

function departmentNameById(departmentId: string, departments: DepartmentRow[]) {
  const match = departments.find((department) => department.id === departmentId);
  return match ? match.name : departmentId;
}