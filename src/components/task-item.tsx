"use client";

import {
  ExternalLink,
  Clock,
  Loader2,
  GitPullRequest,
  CircleCheck,
  CircleX,
  DollarSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Task, TaskStatus } from "@/types";

interface TaskItemProps {
  task: Task;
}

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; iconColor: string; icon: React.ElementType }
> = {
  queued: {
    label: "待機中",
    color: "bg-stone-100 text-stone-500 border-stone-200",
    iconColor: "text-stone-400",
    icon: Clock,
  },
  in_progress: {
    label: "実装中",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    iconColor: "text-amber-500",
    icon: Loader2,
  },
  review: {
    label: "レビュー待ち",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    iconColor: "text-blue-500",
    icon: GitPullRequest,
  },
  done: {
    label: "完了",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    iconColor: "text-emerald-500",
    icon: CircleCheck,
  },
  failed: {
    label: "失敗",
    color: "bg-red-50 text-red-700 border-red-200",
    iconColor: "text-red-500",
    icon: CircleX,
  },
};

export function TaskItem({ task }: TaskItemProps) {
  const config = STATUS_CONFIG[task.status];
  const StatusIcon = config.icon;
  const isDone = task.status === "done";

  return (
    <div
      className={`group flex items-start gap-3 rounded-lg border p-4 transition-all duration-200 ${
        isDone
          ? "border-stone-100 bg-stone-50/50 opacity-60"
          : "border-stone-200 bg-white hover:border-stone-300 shadow-sm"
      }`}
    >
      <div className="mt-0.5 shrink-0">
        <StatusIcon
          className={`h-5 w-5 ${
            task.status === "in_progress" ? "animate-spin" : ""
          } ${config.iconColor}`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-stone-400">
            {task.repo}#{task.issueNumber}
          </span>
          <h3
            className={`truncate text-sm font-medium ${
              isDone ? "text-stone-400 line-through" : "text-stone-900"
            }`}
          >
            {task.title}
          </h3>
        </div>

        {task.description && (
          <p className="mt-1 line-clamp-2 text-xs text-stone-500">
            {task.description}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${config.color}`}
          >
            {config.label}
          </Badge>
          {task.labels.map((label) => (
            <Badge
              key={label}
              variant="outline"
              className="border-[#c35a2c]/20 bg-[#c35a2c]/5 text-[#c35a2c] text-[10px] px-1.5 py-0"
            >
              {label}
            </Badge>
          ))}
          {task.cost !== null && (
            <span className="flex items-center gap-0.5 text-[10px] text-stone-400">
              <DollarSign className="h-3 w-3" />
              {task.cost.toFixed(2)}
            </span>
          )}
          <span className="text-[10px] text-stone-400">
            {new Date(task.createdAt).toLocaleDateString("ja-JP")}
          </span>
        </div>
      </div>

      <a
        href={task.issueUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded p-1 text-stone-400 transition-colors hover:text-[#c35a2c]"
        title="GitHub で見る"
      >
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}
