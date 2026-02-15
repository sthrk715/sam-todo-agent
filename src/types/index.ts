export type TaskStatus = "queued" | "in_progress" | "review" | "done" | "failed";

export interface Task {
  id: number;
  title: string;
  description: string;
  labels: string[];
  state: "open" | "closed";
  status: TaskStatus;
  cost: number | null;
  issueNumber: number;
  issueUrl: string;
  repo: string;
  createdAt: string;
  updatedAt?: string;
  closedAt?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  label?: string;
  repo: string;
}

export interface Repo {
  name: string;
  fullName: string;
  description: string;
  private: boolean;
}
