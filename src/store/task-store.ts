import { create } from "zustand";
import type { Task, CreateTaskInput, Repo, TaskStatus } from "@/types";
import { createIssue, fetchAllIssues, fetchRepos, startImplementation, deleteIssue, retryFailedTask } from "@/actions/github";

// ステータスの進行順序（syncでの巻き戻りを防止）
const STATUS_ORDER: Record<TaskStatus, number> = {
  queued: 0,
  in_progress: 1,
  review: 2,
  done: 3,
  failed: 3,
};

function mergeTasks(local: Task[], remote: Task[]): Task[] {
  const localMap = new Map(local.map((t) => [t.issueNumber, t]));
  const remoteIds = new Set(remote.map((t) => t.issueNumber));
  const localOnly = local.filter((t) => !remoteIds.has(t.issueNumber));
  const merged = remote.map((r) => {
    const l = localMap.get(r.issueNumber);
    if (l && STATUS_ORDER[l.status] > STATUS_ORDER[r.status]) {
      return { ...r, status: l.status };
    }
    return r;
  });
  return [...localOnly, ...merged];
}

interface TaskState {
  repos: Repo[];
  selectedRepo: string;
  tasks: Task[];
  loading: boolean;
  syncing: boolean;
  error: string | null;

  loadRepos: () => Promise<void>;
  setSelectedRepo: (repo: string) => void;
  addTask: (input: CreateTaskInput) => Promise<Task>;
  startImpl: (issueNumber: number) => Promise<void>;
  deleteTask: (issueNumber: number) => Promise<void>;
  retryTask: (issueNumber: number) => Promise<void>;
  syncTasks: () => Promise<void>;
  setTasksFromSSE: (tasks: Task[]) => void;
  clearError: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  repos: [],
  selectedRepo: "",
  tasks: [],
  loading: false,
  syncing: false,
  error: null,

  loadRepos: async () => {
    try {
      const repos = await fetchRepos();
      set({ repos });
      const defaultRepo = process.env.NEXT_PUBLIC_GITHUB_REPO || "";
      const { selectedRepo } = get();
      if (!selectedRepo) {
        const initial =
          repos.find((r) => r.name === defaultRepo)?.name ||
          repos[0]?.name ||
          "";
        set({ selectedRepo: initial });
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "リポジトリの取得に失敗しました";
      set({ error: message });
    }
  },

  setSelectedRepo: (repo) => {
    set({ selectedRepo: repo });
  },

  addTask: async (input) => {
    set({ loading: true, error: null });
    try {
      const task = await createIssue(input);
      set((state) => ({
        tasks: [task, ...state.tasks],
        loading: false,
      }));
      return task;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "タスクの作成に失敗しました";
      set({ error: message, loading: false });
      throw err;
    }
  },

  startImpl: async (issueNumber) => {
    try {
      await startImplementation(issueNumber);
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.issueNumber === issueNumber ? { ...t, status: "in_progress" as const } : t
        ),
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "実装の開始に失敗しました";
      set({ error: message });
      throw err;
    }
  },

  deleteTask: async (issueNumber) => {
    try {
      await deleteIssue(issueNumber);
      // ローカル状態から即座に削除
      set((state) => ({
        tasks: state.tasks.filter((t) => t.issueNumber !== issueNumber),
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "タスクの削除に失敗しました";
      set({ error: message });
      throw err;
    }
  },

  retryTask: async (issueNumber) => {
    try {
      await retryFailedTask(issueNumber);
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.issueNumber === issueNumber
            ? { ...t, status: "queued" as const, state: "open" as const }
            : t
        ),
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "タスクの再試行に失敗しました";
      set({ error: message });
      throw err;
    }
  },

  syncTasks: async () => {
    set({ syncing: true, error: null });
    try {
      const remoteTasks = await fetchAllIssues();
      set((state) => ({
        tasks: mergeTasks(state.tasks, remoteTasks),
        syncing: false,
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "同期に失敗しました";
      set({ error: message, syncing: false });
    }
  },

  setTasksFromSSE: (remoteTasks) => {
    set((state) => ({
      tasks: mergeTasks(state.tasks, remoteTasks),
    }));
  },

  clearError: () => set({ error: null }),
}));
