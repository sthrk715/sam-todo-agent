"use client";

import { useState } from "react";
import { Plus, Loader2, Lock, Globe } from "lucide-react";
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
  const { addTask, loading, repos, selectedRepo, setSelectedRepo } = useTaskStore();

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
        <Label className="text-stone-600">
          対象リポジトリ <span className="text-[#c35a2c]">*</span>
        </Label>
        <Select value={selectedRepo} onValueChange={setSelectedRepo}>
          <SelectTrigger className="border-stone-200 bg-stone-50 text-stone-900 focus:ring-[#c35a2c]/30">
            <SelectValue placeholder="リポジトリを選択" />
          </SelectTrigger>
          <SelectContent className="border-stone-200 bg-white">
            {repos.map((repo) => (
              <SelectItem
                key={repo.name}
                value={repo.name}
                className="text-stone-900 focus:bg-[#c35a2c]/5 focus:text-[#c35a2c]"
              >
                <span className="flex items-center gap-1.5">
                  {repo.private ? (
                    <Lock className="h-3 w-3 text-stone-400" />
                  ) : (
                    <Globe className="h-3 w-3 text-stone-400" />
                  )}
                  {repo.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title" className="text-stone-600">
          タイトル <span className="text-[#c35a2c]">*</span>
        </Label>
        <Input
          id="title"
          placeholder="例: ログインページをNext.jsで作成"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus-visible:ring-[#c35a2c]/30"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-stone-600">
          説明
        </Label>
        <Textarea
          id="description"
          placeholder="例: メールとパスワードで認証。Google OAuth対応。バリデーションはzod。失敗時にエラー表示"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus-visible:ring-[#c35a2c]/30 resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-stone-600">ラベル</Label>
        <Select value={label} onValueChange={setLabel}>
          <SelectTrigger className="border-stone-200 bg-stone-50 text-stone-900 focus:ring-[#c35a2c]/30">
            <SelectValue placeholder="タスクの種類を選択" />
          </SelectTrigger>
          <SelectContent className="border-stone-200 bg-white">
            {LABEL_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="text-stone-900 focus:bg-[#c35a2c]/5 focus:text-[#c35a2c]"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ul className="space-y-1 text-[11px] text-stone-400">
          <li><span className="text-stone-600">feature</span> — 新しい画面や機能を追加したいとき</li>
          <li><span className="text-stone-600">bug</span> — 既存の不具合を直したいとき</li>
          <li><span className="text-stone-600">refactor</span> — 動作は変えずコードを整理したいとき</li>
          <li><span className="text-stone-600">docs</span> — READMEや説明文を書きたいとき</li>
          <li><span className="text-stone-600">test</span> — テストコードを追加したいとき</li>
          <li><span className="text-stone-600">chore</span> — 設定変更や依存関係の更新など</li>
        </ul>
      </div>

      <Button
        type="submit"
        disabled={loading || !title.trim() || !selectedRepo}
        className="w-full bg-[#c35a2c] hover:bg-[#a84d26] text-white font-medium transition-all duration-200"
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
