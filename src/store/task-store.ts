import { create } from "zustand";
import type { Task, CreateTaskInput, Repo, TaskStatus } from "@/types";
import { createIssue, fetchAllIssues, fetchRepos, startImplementation } from "@/lib/github";

// ステータスの進行順序（syncでの巻き戻りを防止）
const STATUS_ORDER: Record<TaskStatus, number> = {
  queued: 0,
  in_progress: 1,
  review: 2,
  done: 3,
  failed: 3,
};

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
  startImpl: (issueNumber: number) => Promise<void>;
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
      // ローカル状態を即座に更新
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

  syncTasks: async () => {
    set({ syncing: true, error: null });
    try {
      const remoteTasks = await fetchAllIssues();
      set((state) => {
        const localMap = new Map(state.tasks.map((t) => [t.issueNumber, t]));
        // APIにまだ反映されていないローカル追加タスクを保持
        const remoteIds = new Set(remoteTasks.map((t) => t.issueNumber));
        const localOnly = state.tasks.filter(
          (t) => !remoteIds.has(t.issueNumber)
        );
        // ステータスの巻き戻りを防止（楽観的更新を維持）
        const merged = remoteTasks.map((remote) => {
          const local = localMap.get(remote.issueNumber);
          if (local && STATUS_ORDER[local.status] > STATUS_ORDER[remote.status]) {
            return { ...remote, status: local.status };
          }
          return remote;
        });
        return { tasks: [...localOnly, ...merged], syncing: false };
      });
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
