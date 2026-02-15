import { create } from "zustand";
import type { Task, CreateTaskInput, Repo } from "@/types";
import { createIssue, fetchIssues, fetchRepos } from "@/lib/github";

interface TaskState {
  repos: Repo[];
  selectedRepo: string;
  tasks: Task[];
  loading: boolean;
  syncing: boolean;
  error: string | null;
  pollingId: ReturnType<typeof setInterval> | null;

  loadRepos: () => Promise<void>;
  setSelectedRepo: (repo: string) => void;
  addTask: (input: CreateTaskInput) => Promise<Task>;
  syncTasks: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  clearError: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  repos: [],
  selectedRepo: "",
  tasks: [],
  loading: false,
  syncing: false,
  error: null,
  pollingId: null,

  loadRepos: async () => {
    try {
      const repos = await fetchRepos();
      set({ repos });
      // デフォルトで環境変数のリポジトリを選択、なければ最初のリポジトリ
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
    const { stopPolling, startPolling } = get();
    stopPolling();
    set({ selectedRepo: repo, tasks: [] });
    startPolling();
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

  syncTasks: async () => {
    const { selectedRepo } = get();
    if (!selectedRepo) return;

    set({ syncing: true, error: null });
    try {
      const tasks = await fetchIssues(selectedRepo);
      set({ tasks, syncing: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "同期に失敗しました";
      set({ error: message, syncing: false });
    }
  },

  startPolling: () => {
    const { pollingId } = get();
    if (pollingId) return;

    get().syncTasks();

    const id = setInterval(() => {
      get().syncTasks();
    }, 10_000);

    set({ pollingId: id });
  },

  stopPolling: () => {
    const { pollingId } = get();
    if (pollingId) {
      clearInterval(pollingId);
      set({ pollingId: null });
    }
  },

  clearError: () => set({ error: null }),
}));
