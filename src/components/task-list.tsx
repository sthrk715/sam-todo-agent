"use client";

import { useEffect } from "react";
import { RefreshCw, Loader2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTaskStore } from "@/store/task-store";
import { TaskItem } from "./task-item";

export function TaskList() {
  const { tasks, syncing, error, startPolling, stopPolling, syncTasks } =
    useTaskStore();

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  const openTasks = tasks.filter((t) => t.state === "open");
  const closedTasks = tasks.filter((t) => t.state === "closed");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-zinc-100">タスク一覧</h2>
          <span className="rounded-full bg-cyan-950/50 px-2 py-0.5 text-xs text-cyan-400 font-mono">
            {openTasks.length} open
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => syncTasks()}
          disabled={syncing}
          className="text-zinc-400 hover:text-cyan-400"
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
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {tasks.length === 0 && !syncing && (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
          <Inbox className="mb-3 h-10 w-10" />
          <p className="text-sm">タスクがありません</p>
          <p className="text-xs">左のフォームからタスクを追加してください</p>
        </div>
      )}

      {tasks.length === 0 && syncing && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
        </div>
      )}

      <div className="space-y-2">
        {openTasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>

      {closedTasks.length > 0 && (
        <>
          <div className="flex items-center gap-2 pt-2">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-xs text-zinc-600">
              完了 ({closedTasks.length})
            </span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>
          <div className="space-y-2">
            {closedTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
