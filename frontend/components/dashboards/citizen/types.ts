export type CitizenIssue = {
  id: string;
  title: string;
  description?: string;
  status: string;
  supporterCount?: number;
  createdAt?: string;
  departmentId?: string;
  imageUrls?: string[];
  isReporter?: boolean;
  isSupporter?: boolean;
};

export type IssuesResponse = {
  success: boolean;
  data?: { items?: CitizenIssue[]; item?: CitizenIssue };
  error?: { message?: string };
};
