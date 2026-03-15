export type HeadView =
  | "dashboard"
  | "pending_issues"
  | "worker_analytics"
  | "worker_management"
  | "resolved_issues"
  | "escalations";

export type HeadIssue = {
  id: string;
  title: string;
  description: string;
  status: string;
  departmentId?: string;
  category?: string;
  reporterId?: string;
  createdAt?: string;
  updatedAt?: string;
  imageUrls?: string[];
  location?: {
    coordinates?: number[];
  };
  authority?: {
    assignedToWorkerId?: string;
    resolvedAt?: string;
  };
};

export type HeadWorkerMetric = {
  workerId: string;
  assigned: number;
  completed: number;
  pending: number;
  successRate: number;
};

export type HeadWorkerStatus = "ACTIVE" | "IDLE" | "DISABLED";

export type HeadWorkerSummary = {
  workerId: string;
  workerName: string;
  email: string;
  status: HeadWorkerStatus;
  assigned: number;
  completed: number;
  pending: number;
  successRate: number;
  lastActiveAt?: string;
};

export type HeadApiResponse = {
  success: boolean;
  requestId?: string;
  data?: {
    items?: HeadIssue[];
    item?: HeadIssue;
  };
  error?: {
    message?: string;
  };
};
