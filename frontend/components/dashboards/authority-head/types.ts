export type HeadView =
  | "dashboard"
  | "pending_issues"
  | "assigned_issues"
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
  reporterName?: string;
  reporterEmail?: string;
  severity?: string;
  supporterCount?: number;
  flagsCount?: number;
  createdAt?: string;
  updatedAt?: string;
  imageUrls?: string[];
  resolutionImageUrls?: string[];
  resolutionNotes?: string;
  location?: {
    coordinates?: number[];
  };
  statusHistory?: Array<{
    title?: string;
    description?: string;
    status?: string;
    timestamp?: string;
    at?: string;
    createdAt?: string;
    notes?: string;
  }>;
  authority?: {
    assignedToWorkerId?: string;
    startedAt?: string;
    deadlineAt?: string;
    resolvedAt?: string;
    resolutionNotes?: string;
    resolutionImageUrls?: string[];
  };
  escalationReason?: string;
};

export type HeadWorker = {
  id: string;
  name?: string;
  email: string;
  blocked?: boolean;
  departmentId?: string;
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
