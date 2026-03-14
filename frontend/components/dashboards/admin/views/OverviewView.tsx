import type { ReactNode } from "react";
import { Building2, CheckCircle2, ClipboardList, ShieldUser, Siren } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import type { DepartmentRow, OverviewStats } from "@/components/dashboards/admin/types";

type OverviewViewProps = {
  overviewStats: OverviewStats;
  departmentRows: DepartmentRow[];
};

export function OverviewView({ overviewStats, departmentRows }: OverviewViewProps) {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Total Departments" value={overviewStats.totalDepartments} icon={<Building2 className="h-5 w-5 text-sky-600" />} />
        <MetricCard label="Total Department Heads" value={overviewStats.totalHeads} icon={<ShieldUser className="h-5 w-5 text-indigo-600" />} />
        <MetricCard label="Total Issues Reported" value={overviewStats.totalIssuesReported} icon={<ClipboardList className="h-5 w-5 text-blue-600" />} />
        <MetricCard label="Total Issues Resolved" value={overviewStats.totalIssuesResolved} icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} />
        <MetricCard label="Pending Escalations" value={overviewStats.pendingEscalations} icon={<Siren className="h-5 w-5 text-rose-600" />} />
      </div>

      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Department Performance Comparison</h2>
          <Table headers={["Department", "Head", "Total Issues", "Resolved Issues", "Success Rate"]}>
            {departmentRows.map((row) => (
              <tr key={row.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{row.name}</td>
                <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">{row.headName}</td>
                <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">{row.totalIssues}</td>
                <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">{row.resolvedIssues}</td>
                <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">{row.successRate}%</td>
              </tr>
            ))}
            {departmentRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  No department metrics yet. Create departments and register heads to build system coverage.
                </td>
              </tr>
            ) : null}
          </Table>
        </CardBody>
      </Card>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        System-wide issue totals currently use available admin-facing data. Dedicated admin metrics APIs are tracked in backend sync docs.
      </p>
    </section>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
          {icon}
        </div>
        <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{value}</p>
      </CardBody>
    </Card>
  );
}