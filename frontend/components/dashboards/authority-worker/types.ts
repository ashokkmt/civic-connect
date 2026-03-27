import type { WorkerView } from "@/components/layout/AuthorityWorkerSidebar";

export type { WorkerView };

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
