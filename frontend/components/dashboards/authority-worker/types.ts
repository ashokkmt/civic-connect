import type { WorkerView } from "@/components/layout/AuthorityWorkerSidebar";

export type { WorkerView };

export type WorkerIssue = {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  priority?: string;
  severity?: string;
  location?: {
    type?: string;
    coordinates?: number[];
  };
};

export type WorkerResponse = {
  success: boolean;
  requestId?: string;
  data?: {
    items?: WorkerIssue[];
  };
  error?: {
    message?: string;
  };
};
