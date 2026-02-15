"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  Loader2,
  Inbox,
  Clock,
  GitPullRequest,
  CircleCheck,
  CircleX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTaskStore } from "@/store/task-store";
import { TaskItem } from "./task-item";
import type { TaskStatus } from "@/types";

const STATUS_TABS: {
  key: TaskStatus | "all";
  label: string;
  icon: React.ElementType | null;
}[] = [
  { key: "queued", label: "待機中", icon: Clock },
  { key: "in_progress", label: "実装中", icon: Loader2 },
  { key: "review", label: "レビュー", icon: GitPullRequest },
  { key: "done", label: "完了", icon: CircleCheck },
  { key: "failed", label: "失敗", icon: CircleX },
  { key: "all", label: "すべて", icon: null },
];

export function TaskList() {
  const { tasks, syncing, error, startPolling, stopPolling, syncTasks } =
    useTaskStore();
  const [filter, setFilter] = useState<TaskStatus | "all">("queued");

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  const filteredTasks =
    filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-900">タスク一覧</h2>
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

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.key === "all"
              ? tasks.length
              : tasks.filter((t) => t.status === tab.key).length;
          const isActive = filter === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-[#c35a2c] text-white"
                  : "bg-stone-100 text-stone-500 hover:bg-stone-200"
              }`}
            >
              {Icon && (
                <Icon
                  className={`h-3 w-3 ${
                    tab.key === "in_progress" && !isActive ? "animate-spin" : ""
                  }`}
                />
              )}
              {tab.label}
              <span
                className={`font-mono ${
                  isActive ? "text-white/80" : "text-stone-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
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
              : `${STATUS_TABS.find((t) => t.key === filter)?.label}のタスクがありません`}
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
