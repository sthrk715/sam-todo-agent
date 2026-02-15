"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw,
  Loader2,
  Inbox,
  Clock,
  GitPullRequest,
  CircleCheck,
  CircleX,
  ListFilter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTaskStore } from "@/store/task-store";
import { useSSE } from "@/hooks/use-sse";
import { TaskItem } from "./task-item";
import type { Task, TaskStatus } from "@/types";

const STATUS_OPTIONS: {
  key: TaskStatus | "all";
  label: string;
  icon: React.ElementType;
}[] = [
  { key: "all", label: "すべて", icon: ListFilter },
  { key: "queued", label: "待機中", icon: Clock },
  { key: "in_progress", label: "実装中", icon: Loader2 },
  { key: "review", label: "レビュー", icon: GitPullRequest },
  { key: "done", label: "完了", icon: CircleCheck },
  { key: "failed", label: "失敗", icon: CircleX },
];

export function TaskList() {
  const { tasks, syncing, error, syncTasks, setTasksFromSSE } =
    useTaskStore();
  const [filter, setFilter] = useState<TaskStatus | "all">("all");

  // 初回同期
  useEffect(() => {
    syncTasks();
  }, [syncTasks]);

  // SSEでリアルタイム更新
  const handleSSEUpdate = useCallback(
    (remoteTasks: unknown[]) => {
      setTasksFromSSE(remoteTasks as Task[]);
    },
    [setTasksFromSSE]
  );
  useSSE(handleSSEUpdate);

  const filteredTasks =
    filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-stone-900">タスク一覧</h2>
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v as TaskStatus | "all")}
          >
            <SelectTrigger className="h-8 w-[160px] border-stone-200 bg-stone-50 text-xs text-stone-700 focus:ring-[#c35a2c]/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-stone-200 bg-white">
              {STATUS_OPTIONS.map((opt) => {
                const count =
                  opt.key === "all"
                    ? tasks.length
                    : tasks.filter((t) => t.status === opt.key).length;
                const Icon = opt.icon;
                return (
                  <SelectItem
                    key={opt.key}
                    value={opt.key}
                    className="text-stone-700 text-xs focus:bg-[#c35a2c]/5 focus:text-[#c35a2c]"
                  >
                    <span className="flex items-center gap-1.5">
                      <Icon className="h-3 w-3" />
                      {opt.label}
                      <span className="font-mono text-stone-400">{count}</span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => syncTasks()}
          disabled={syncing}
          className="text-stone-500 hover:text-[#c35a2c]"
        >
          {syncing ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
          )}
          同期
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {filteredTasks.length === 0 && !syncing && (
        <div className="flex flex-col items-center justify-center py-16 text-stone-400">
          <Inbox className="mb-3 h-10 w-10" />
          <p className="text-sm">
            {filter === "all"
              ? "タスクがありません"
              : `${STATUS_OPTIONS.find((t) => t.key === filter)?.label}のタスクがありません`}
          </p>
        </div>
      )}

      {filteredTasks.length === 0 && syncing && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#c35a2c]" />
        </div>
      )}

      <div className="space-y-2">
        {filteredTasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
