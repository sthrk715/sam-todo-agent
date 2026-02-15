export interface Task {
  id: number;
  title: string;
  description: string;
  labels: string[];
  state: "open" | "closed";
  issueNumber: number;
  issueUrl: string;
  repo: string;
  createdAt: string;
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
