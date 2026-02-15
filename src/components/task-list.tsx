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

  const activeTasks = tasks.filter((t) => t.status !== "done");
  const doneTasks = tasks.filter((t) => t.status === "done");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-stone-900">タスク一覧</h2>
          <span className="rounded-full bg-[#c35a2c]/10 px-2 py-0.5 text-xs text-[#c35a2c] font-mono">
            {activeTasks.length} active
          </span>
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

      {tasks.length === 0 && !syncing && (
        <div className="flex flex-col items-center justify-center py-16 text-stone-400">
          <Inbox className="mb-3 h-10 w-10" />
          <p className="text-sm">タスクがありません</p>
          <p className="text-xs">左のフォームからタスクを追加してください</p>
        </div>
      )}

      {tasks.length === 0 && syncing && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#c35a2c]" />
        </div>
      )}

      <div className="space-y-2">
        {activeTasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>

      {doneTasks.length > 0 && (
        <>
          <div className="flex items-center gap-2 pt-2">
            <div className="h-px flex-1 bg-stone-200" />
            <span className="text-xs text-stone-400">
              完了 ({doneTasks.length})
            </span>
            <div className="h-px flex-1 bg-stone-200" />
          </div>
          <div className="space-y-2">
            {doneTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
