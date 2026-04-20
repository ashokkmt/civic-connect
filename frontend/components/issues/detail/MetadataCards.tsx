import { CalendarDays, Fingerprint, MapPin } from "lucide-react";
import { formatIssueDisplayId } from "@/lib/issues/displayId";

type MetadataCardsProps = {
  issueId: string;
  coordinates?: [number, number];
  createdAt?: string;
};

function formatLocation(coordinates?: [number, number]) {
  if (!coordinates) {
    return { title: "Not available", subtitle: "Location not provided" };
  }

  const [lng, lat] = coordinates;
  return {
    title: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    subtitle: "Coordinates",
  };
}

function formatReported(createdAt?: string) {
  if (!createdAt) {
    return { title: "Unknown", subtitle: "Reported time unavailable" };
  }

  const created = new Date(createdAt);
  const diffMs = Date.now() - created.getTime();
  const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));

  return {
    title: created.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
    subtitle: `${diffHours} hours ago`,
  };
}

export function MetadataCards({ issueId, coordinates, createdAt }: MetadataCardsProps) {
  const location = formatLocation(coordinates);
  const reported = formatReported(createdAt);

  return (
    <section className="grid gap-3 md:grid-cols-3">
      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          <MapPin className="h-4 w-4" />
          Location
        </p>
        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{location.title}</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{location.subtitle}</p>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          <CalendarDays className="h-4 w-4" />
          Date Reported
        </p>
        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{reported.title}</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{reported.subtitle}</p>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          <Fingerprint className="h-4 w-4" />
          Issue ID
        </p>
        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{formatIssueDisplayId(issueId)}</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Citizen report reference</p>
      </article>
    </section>
  );
}