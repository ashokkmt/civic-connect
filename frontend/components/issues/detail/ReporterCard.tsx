type ReporterCardProps = {
  reporterName?: string;
  reporterEmail?: string;
  reporterId?: string;
};

function initials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ReporterCard({ reporterName, reporterEmail, reporterId }: ReporterCardProps) {
  const name = reporterName?.trim() || "Unknown Reporter";
  const secondary = reporterEmail?.trim() || reporterId?.trim() || "Identity not shared";

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
        Reporter Profile
      </p>

      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-zinc-700 dark:border-slate-700 dark:bg-slate-800 dark:text-zinc-200">
          {initials(name)}
        </div>

        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{name}</p>
          <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Verified Resident</p>
        </div>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">{secondary}</p>
    </section>
  );
}