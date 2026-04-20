export type WorkerView = "overview" | "assigned_issues" | "submit_resolution" | "my_work";

export type WorkerIssue = {
  id: string;
  title: string;
  description: string;
  status: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
  priority?: string;
  severity?: string;
  imageUrls?: string[];
  resolutionImageUrls?: string[];
  location?: {
    type?: string;
    coordinates?: number[];
  };
  authority?: {
    assignedToWorkerId?: string;
    startedAt?: string;
    deadlineAt?: string;
    resolvedAt?: string;
    resolutionNotes?: string;
    resolutionImageUrls?: string[];
  };
  lifecycle?: {
    assignedAt?: string;
    resolvedAt?: string;
    closedAt?: string;
  };
};

export type WorkerResponse = {
  success: boolean;
  requestId?: string;
  data?: {
    items?: WorkerIssue[];
    item?: WorkerIssue;
  };
  error?: {
    message?: string;
  };
};
