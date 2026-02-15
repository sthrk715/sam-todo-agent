"use client";

import {
  DollarSign,
  Clock,
  Loader2,
  GitPullRequest,
  CircleCheck,
  CircleX,
} from "lucide-react";
import { useTaskStore } from "@/store/task-store";
import type { TaskStatus } from "@/types";

const STATUS_SUMMARY: {
  key: TaskStatus;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { key: "queued", label: "待機", icon: Clock, color: "text-zinc-400" },
  {
    key: "in_progress",
    label: "実装中",
    icon: Loader2,
    color: "text-amber-400",
  },
  {
    key: "review",
    label: "レビュー",
    icon: GitPullRequest,
    color: "text-blue-400",
  },
  { key: "done", label: "完了", icon: CircleCheck, color: "text-emerald-400" },
  { key: "failed", label: "失敗", icon: CircleX, color: "text-red-400" },
];

export function CostDashboard() {
  const { tasks } = useTaskStore();

  if (tasks.length === 0) return null;

  const totalCost = tasks.reduce((sum, t) => sum + (t.cost ?? 0), 0);
  const tasksWithCost = tasks.filter((t) => t.cost !== null).length;
  const statusCounts = STATUS_SUMMARY.map((s) => ({
    ...s,
    count: tasks.filter((t) => t.status === s.key).length,
  })).filter((s) => s.count > 0);

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
      {/* ステータス集計 */}
      {statusCounts.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.key} className="flex items-center gap-1.5">
            <Icon
              className={`h-3.5 w-3.5 ${s.color} ${
                s.key === "in_progress" ? "animate-spin" : ""
              }`}
            />
            <span className="text-xs text-zinc-400">
              {s.label}{" "}
              <span className="font-mono font-semibold text-zinc-200">
                {s.count}
              </span>
            </span>
          </div>
        );
      })}

      {/* 区切り */}
      <div className="h-4 w-px bg-zinc-700" />

      {/* コスト */}
      <div className="flex items-center gap-1.5">
        <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-xs text-zinc-400">
          API{" "}
          <span className="font-mono font-semibold text-emerald-300">
            ${totalCost.toFixed(2)}
          </span>
          {tasksWithCost > 0 && (
            <span className="text-zinc-600">
              {" "}
              ({tasksWithCost}件)
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
