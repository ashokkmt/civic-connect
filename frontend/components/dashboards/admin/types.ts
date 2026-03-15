export type ApiResponse<T = unknown> = {
  success: boolean;
  requestId?: string;
  data?: {
    items?: T[];
    item?: T;
  };
  error?: {
    message?: string;
  };
};

export type AdminView = "overview" | "departments" | "head_registration" | "escalations";

export type EscalationItem = {
  id?: string;
  issueId?: string;
  departmentId?: string;
  escalationLevel?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  authority?: {
    assignedToWorkerId?: string;
  };
};

export type DepartmentRow = {
  id: string;
  name: string;
  headName: string;
  totalIssues: number;
  resolvedIssues: number;
  successRate: number;
  disabled: boolean;
};

export type HeadRow = {
  id: string;
  name: string;
  email: string;
  departmentId: string;
};

export type OverviewStats = {
  totalDepartments: number;
  totalHeads: number;
  totalIssuesReported: number;
  totalIssuesResolved: number;
  pendingEscalations: number;
};