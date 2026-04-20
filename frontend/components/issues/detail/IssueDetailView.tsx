import { ImageGallery } from "@/components/issues/detail/ImageGallery";
import { IssueHeader } from "@/components/issues/detail/IssueHeader";
import { MapCard } from "@/components/issues/detail/MapCard";
import { MetadataCards } from "@/components/issues/detail/MetadataCards";
import { ReporterCard } from "@/components/issues/detail/ReporterCard";
import { StatusTimeline, type StatusTimelineItem } from "@/components/issues/detail/StatusTimeline";
import { SupportSidebar } from "@/components/issues/detail/SupportSidebar";

export type IssueDetailData = {
  id: string;
  title: string;
  description: string;
  status: string;
  supporterCount?: number;
  flagsCount?: number;
  createdAt?: string;
  departmentId?: string;
  imageUrls?: string[];
  location?: {
    coordinates?: [number, number];
  };
  isReporter?: boolean;
  isSupporter?: boolean;
  isFlagged?: boolean;
  reporterId?: string;
  reporterName?: string;
  reporterEmail?: string;
  statusHistory?: Array<{
    title?: string;
    description?: string;
    timestamp?: string;
    at?: string;
    createdAt?: string;
    status?: string;
    notes?: string;
  }>;
  updatedAt?: string;
};

type IssueDetailViewProps = {
  issue: IssueDetailData;
  backHref: string;
  backLabel?: string;
};

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function buildTimeline(issue: IssueDetailData): StatusTimelineItem[] {
  const apiHistory = issue.statusHistory?.filter((item) =>
    Boolean(item.title || item.status || item.timestamp || item.at || item.createdAt)
  );

  if (apiHistory && apiHistory.length > 0) {
    return apiHistory.map((item, index) => ({
      title: item.title?.trim() || (item.status ? toTitleCase(item.status) : `Status update ${index + 1}`),
      description: item.description?.trim() || item.notes?.trim() || "Issue status updated.",
      timestamp: item.timestamp || item.at || item.createdAt,
    }));
  }

  const fallback: StatusTimelineItem[] = [];

  if (issue.createdAt) {
    fallback.push({
      title: "Issue Reported",
      description: "Citizen report received via CivicConnect.",
      timestamp: issue.createdAt,
    });
  }

  fallback.unshift({
    title: toTitleCase(issue.status),
    description: "Current issue status from the lifecycle tracker.",
    timestamp: issue.updatedAt || issue.createdAt,
  });

  return fallback;
}

export function IssueDetailView({ issue, backHref, backLabel = "Issues List" }: IssueDetailViewProps) {
  const timeline = buildTimeline(issue);
  const coordinates = issue.location?.coordinates;

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <IssueHeader
        issueId={issue.id}
        title={issue.title}
        description={issue.description}
        status={issue.status}
        backHref={backHref}
        backLabel={backLabel}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.85fr)_minmax(280px,1fr)]">
        <div className="space-y-4">
          <ImageGallery imageUrls={issue.imageUrls} />
          <MetadataCards issueId={issue.id} coordinates={coordinates} createdAt={issue.createdAt} />
          <StatusTimeline items={timeline} />
        </div>

        <aside className="space-y-4 self-start xl:sticky xl:top-6">
          <SupportSidebar
            issueId={issue.id}
            status={issue.status}
            isReporter={Boolean(issue.isReporter)}
            isSupporter={Boolean(issue.isSupporter)}
            isFlagged={Boolean(issue.isFlagged)}
            supporterCount={issue.supporterCount}
            flagsCount={issue.flagsCount}
          />
          <MapCard coordinates={coordinates} />
          <ReporterCard
            reporterName={issue.reporterName}
            reporterEmail={issue.reporterEmail}
            reporterId={issue.reporterId}
          />
        </aside>
      </div>
    </section>
  );
}
