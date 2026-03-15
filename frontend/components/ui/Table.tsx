import type { ReactNode } from "react";

type TableProps = {
  headers: string[];
  children: ReactNode;
  variant?: "default" | "slate";
};

export function Table({ headers, children, variant = "default" }: TableProps) {
  const isSlate = variant === "slate";

  return (
    <div
      className={`overflow-x-auto rounded-2xl border ${
        isSlate
          ? "border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
          : "border-[var(--border)] bg-[var(--surface)]"
      }`}
    >
      <table className="min-w-full text-left text-sm">
        <thead
          className={`border-b text-xs uppercase tracking-[0.15em] ${
            isSlate
              ? "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400"
              : "border-[var(--border)] bg-[var(--surface-muted)] text-zinc-500 dark:text-zinc-400"
          }`}
        >
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
