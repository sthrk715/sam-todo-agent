"use client";

import { useEffect } from "react";
import { Bot } from "lucide-react";
import { TaskForm } from "@/components/task-form";
import { TaskList } from "@/components/task-list";
import { CostDashboard } from "@/components/cost-dashboard";
import { ThemeToggle } from "@/components/theme-toggle";
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#c35a2c]/10 dark:bg-[#c35a2c]/20">
              <Bot className="h-5 w-5 text-[#c35a2c]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                Sam TODO Agent
              </h1>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                タスクを追加するだけで、AIが実装を完了させる
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        {/* Left: Form */}
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-stone-700 dark:text-stone-300">
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
