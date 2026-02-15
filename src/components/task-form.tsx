"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTaskStore } from "@/store/task-store";
import { toast } from "sonner";

const LABEL_OPTIONS = [
  { value: "feature", label: "feature - 新機能" },
  { value: "bug", label: "bug - バグ修正" },
  { value: "refactor", label: "refactor - リファクタ" },
  { value: "docs", label: "docs - ドキュメント" },
  { value: "test", label: "test - テスト追加" },
  { value: "chore", label: "chore - 雑務・設定" },
];

export function TaskForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [label, setLabel] = useState("");
  const { addTask, loading, selectedRepo } = useTaskStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedRepo) return;

    try {
      const task = await addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        label: label || undefined,
        repo: selectedRepo,
      });
      toast.success(`${selectedRepo} に Issue #${task.issueNumber} を作成しました`);
      setTitle("");
      setDescription("");
      setLabel("");
    } catch {
      toast.error("タスクの作成に失敗しました");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-zinc-300">
          タイトル <span className="text-cyan-400">*</span>
        </Label>
        <Input
          id="title"
          placeholder="例: ログインページをNext.jsで作成"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="border-zinc-800 bg-zinc-900/50 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-cyan-500/50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-zinc-300">
          説明
        </Label>
        <Textarea
          id="description"
          placeholder="例: メールとパスワードで認証。Google OAuth対応。バリデーションはzod。失敗時にエラー表示"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="border-zinc-800 bg-zinc-900/50 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-cyan-500/50 resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-zinc-300">ラベル</Label>
        <Select value={label} onValueChange={setLabel}>
          <SelectTrigger className="border-zinc-800 bg-zinc-900/50 text-zinc-100 focus:ring-cyan-500/50">
            <SelectValue placeholder="タスクの種類を選択" />
          </SelectTrigger>
          <SelectContent className="border-zinc-800 bg-zinc-900">
            {LABEL_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="text-zinc-100 focus:bg-cyan-950/50 focus:text-cyan-400"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ul className="space-y-1 text-[11px] text-zinc-600">
          <li><span className="text-zinc-400">feature</span> — 新しい画面や機能を追加したいとき</li>
          <li><span className="text-zinc-400">bug</span> — 既存の不具合を直したいとき</li>
          <li><span className="text-zinc-400">refactor</span> — 動作は変えずコードを整理したいとき</li>
          <li><span className="text-zinc-400">docs</span> — READMEや説明文を書きたいとき</li>
          <li><span className="text-zinc-400">test</span> — テストコードを追加したいとき</li>
          <li><span className="text-zinc-400">chore</span> — 設定変更や依存関係の更新など</li>
        </ul>
      </div>

      <Button
        type="submit"
        disabled={loading || !title.trim() || !selectedRepo}
        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-all duration-200 shadow-[0_0_20px_rgba(0,240,255,0.15)] hover:shadow-[0_0_30px_rgba(0,240,255,0.3)]"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Plus className="mr-2 h-4 w-4" />
        )}
        タスクを追加
      </Button>
    </form>
  );
}
