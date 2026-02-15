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
  { label: string; color: string; icon: React.ElementType }
> = {
  queued: {
    label: "待機中",
    color: "bg-zinc-800 text-zinc-400 border-zinc-700",
    icon: Clock,
  },
  in_progress: {
    label: "実装中",
    color: "bg-amber-950/50 text-amber-400 border-amber-800/50",
    icon: Loader2,
  },
  review: {
    label: "レビュー待ち",
    color: "bg-blue-950/50 text-blue-400 border-blue-800/50",
    icon: GitPullRequest,
  },
  done: {
    label: "完了",
    color: "bg-emerald-950/50 text-emerald-400 border-emerald-800/50",
    icon: CircleCheck,
  },
  failed: {
    label: "失敗",
    color: "bg-red-950/50 text-red-400 border-red-800/50",
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
          ? "border-zinc-800/50 bg-zinc-900/30 opacity-60"
          : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
      }`}
    >
      <div className="mt-0.5 shrink-0">
        <StatusIcon
          className={`h-5 w-5 ${
            task.status === "in_progress" ? "animate-spin" : ""
          } ${config.color.includes("text-") ? config.color.split(" ").find((c) => c.startsWith("text-")) : "text-zinc-400"}`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-zinc-500">
            #{task.issueNumber}
          </span>
          <h3
            className={`truncate text-sm font-medium ${
              isDone ? "text-zinc-400 line-through" : "text-zinc-100"
            }`}
          >
            {task.title}
          </h3>
        </div>

        {task.description && (
          <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
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
              className="border-cyan-800/50 bg-cyan-950/30 text-cyan-400 text-[10px] px-1.5 py-0"
            >
              {label}
            </Badge>
          ))}
          {task.cost !== null && (
            <span className="flex items-center gap-0.5 text-[10px] text-zinc-500">
              <DollarSign className="h-3 w-3" />
              {task.cost.toFixed(2)}
            </span>
          )}
          <span className="text-[10px] text-zinc-600">
            {new Date(task.createdAt).toLocaleDateString("ja-JP")}
          </span>
        </div>
      </div>

      <a
        href={task.issueUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded p-1 text-zinc-600 transition-colors hover:text-cyan-400"
        title="GitHub で見る"
      >
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}
