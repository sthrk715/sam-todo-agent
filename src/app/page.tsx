"use client";

import { useEffect } from "react";
import { Bot, Lock, Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskForm } from "@/components/task-form";
import { TaskList } from "@/components/task-list";
import { useTaskStore } from "@/store/task-store";

export default function Home() {
  const { repos, selectedRepo, setSelectedRepo, loadRepos } = useTaskStore();

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

          {/* Repo Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 hidden sm:inline">
              リポジトリ:
            </span>
            <Select value={selectedRepo} onValueChange={setSelectedRepo}>
              <SelectTrigger className="w-[220px] border-zinc-800 bg-zinc-900/50 text-zinc-100 focus:ring-cyan-500/50">
                <SelectValue placeholder="リポジトリを選択" />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-900">
                {repos.map((repo) => (
                  <SelectItem
                    key={repo.name}
                    value={repo.name}
                    className="text-zinc-100 focus:bg-cyan-950/50 focus:text-cyan-400"
                  >
                    <span className="flex items-center gap-1.5">
                      {repo.private ? (
                        <Lock className="h-3 w-3 text-zinc-500" />
                      ) : (
                        <Globe className="h-3 w-3 text-zinc-500" />
                      )}
                      {repo.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

        {/* Right: Task List */}
        <main>
          <TaskList />
        </main>
      </div>
    </div>
  );
}
