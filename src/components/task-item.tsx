"use client";

import { ExternalLink, CircleDot, CircleCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/types";

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const isOpen = task.state === "open";

  return (
    <div
      className={`group flex items-start gap-3 rounded-lg border p-4 transition-all duration-200 ${
        isOpen
          ? "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
          : "border-zinc-800/50 bg-zinc-900/30 opacity-60"
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {isOpen ? (
          <CircleDot className="h-5 w-5 text-emerald-400" />
        ) : (
          <CircleCheck className="h-5 w-5 text-zinc-500" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-zinc-500">
            #{task.issueNumber}
          </span>
          <h3
            className={`truncate text-sm font-medium ${
              isOpen ? "text-zinc-100" : "text-zinc-400 line-through"
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
          {task.labels.map((label) => (
            <Badge
              key={label}
              variant="outline"
              className="border-cyan-800/50 bg-cyan-950/30 text-cyan-400 text-[10px] px-1.5 py-0"
            >
              {label}
            </Badge>
          ))}
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
