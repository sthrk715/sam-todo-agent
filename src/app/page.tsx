"use client";

import { useEffect } from "react";
import { Bot } from "lucide-react";
import { TaskForm } from "@/components/task-form";
import { TaskList } from "@/components/task-list";
import { CostDashboard } from "@/components/cost-dashboard";
import { useTaskStore } from "@/store/task-store";

export default function Home() {
  const { loadRepos } = useTaskStore();

  useEffect(() => {
    loadRepos();
  }, [loadRepos]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-950/50 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
              <Bot className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-100">
                Sam TODO Agent
              </h1>
              <p className="text-xs text-zinc-500">
                タスクを追加するだけで、AIが実装を完了させる
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        {/* Left: Form */}
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-xl border border-zinc-800 bg-[#111111] p-6">
            <h2 className="mb-4 text-sm font-semibold text-zinc-300">
              新しいタスク
            </h2>
            <TaskForm />
          </div>
        </aside>

        {/* Right: Task List + Dashboard */}
        <main className="space-y-4">
          <CostDashboard />
          <TaskList />
        </main>
      </div>
    </div>
  );
}
