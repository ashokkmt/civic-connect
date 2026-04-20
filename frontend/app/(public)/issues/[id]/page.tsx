import { headers } from "next/headers";
import { EmptyState } from "@/components/feedback/EmptyState";
import { IssueDetailView, type IssueDetailData } from "@/components/issues/detail/IssueDetailView";

type IssuePublic = IssueDetailData;

type IssueResponse = {
  success: boolean;
  data?: { item?: IssuePublic };
  error?: { message?: string };
};

async function getIssue(id: string) {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return { success: false, error: { message: "Host header missing" } } as IssueResponse;
  }

  const response = await fetch(`${protocol}://${host}/api/public/issues/${id}`, {
    method: "GET",
    cache: "no-store",
  });

  return (await response.json()) as IssueResponse;
}

export default async function IssueDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await getIssue(id);
  const issue = payload.data?.item;

  if (!payload.success || !issue) {
    return (
      <EmptyState
        title="Issue not found"
        description={payload.error?.message ?? "Unable to load issue details."}
      />
    );
  }

  return (
    <IssueDetailView issue={issue} backHref="/issues" backLabel="Public Issues" />
  );
}
