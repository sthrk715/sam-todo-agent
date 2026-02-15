"use client";

import { useMemo } from "react";
import {
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import {
  DollarSign,
  Activity,
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
  { key: "queued", label: "待機", icon: Clock, color: "text-stone-400" },
  {
    key: "in_progress",
    label: "実装中",
    icon: Loader2,
    color: "text-amber-500",
  },
  {
    key: "review",
    label: "レビュー",
    icon: GitPullRequest,
    color: "text-blue-500",
  },
  { key: "done", label: "完了", icon: CircleCheck, color: "text-emerald-500" },
  { key: "failed", label: "失敗", icon: CircleX, color: "text-red-500" },
];

interface ChartData {
  date: string;
  cost: number;
  count: number;
}

export function CostDashboard() {
  const { tasks } = useTaskStore();

  const totalCost = tasks.reduce((sum, t) => sum + (t.cost ?? 0), 0);
  const totalExecutions = tasks.length;

  const statusCounts = STATUS_SUMMARY.map((s) => ({
    ...s,
    count: tasks.filter((t) => t.status === s.key).length,
  })).filter((s) => s.count > 0);

  const chartData = useMemo<ChartData[]>(() => {
    if (tasks.length === 0) return [];

    const byDate = new Map<string, { cost: number; count: number }>();

    for (const task of tasks) {
      const date = new Date(task.createdAt).toLocaleDateString("ja-JP", {
        month: "numeric",
        day: "numeric",
      });
      const existing = byDate.get(date) || { cost: 0, count: 0 };
      existing.cost += task.cost ?? 0;
      existing.count += 1;
      byDate.set(date, existing);
    }

    return Array.from(byDate.entries())
      .sort((a, b) => {
        const [am, ad] = a[0].split("/").map(Number);
        const [bm, bd] = b[0].split("/").map(Number);
        return am !== bm ? am - bm : ad - bd;
      })
      .map(([date, data]) => ({
        date,
        cost: Number(data.cost.toFixed(2)),
        count: data.count,
      }));
  }, [tasks]);

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-sm">
        {statusCounts.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.key} className="flex items-center gap-1.5">
              <Icon
                className={`h-3.5 w-3.5 ${s.color} ${
                  s.key === "in_progress" ? "animate-spin" : ""
                }`}
              />
              <span className="text-xs text-stone-500">
                {s.label}{" "}
                <span className="font-mono font-semibold text-stone-800">
                  {s.count}
                </span>
              </span>
            </div>
          );
        })}

        {statusCounts.length > 0 && (
          <div className="h-4 w-px bg-stone-200" />
        )}

        <div className="flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-xs text-stone-500">
            API{" "}
            <span className="font-mono font-semibold text-emerald-700">
              ${totalCost.toFixed(2)}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-[#c35a2c]" />
          <span className="text-xs text-stone-500">
            実行{" "}
            <span className="font-mono font-semibold text-[#c35a2c]">
              {totalExecutions}
            </span>
            回
          </span>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-4 text-xs text-stone-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#c35a2c]" />
              APIコスト ($)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 bg-[#6b83b0]" />
              実行回数
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5ddd3"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "#8a857d", fontSize: 11 }}
                axisLine={{ stroke: "#e5ddd3" }}
                tickLine={false}
              />
              <YAxis
                yAxisId="cost"
                orientation="left"
                tick={{ fill: "#c35a2c", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${v}`}
              />
              <YAxis
                yAxisId="count"
                orientation="right"
                tick={{ fill: "#6b83b0", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5ddd3",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#8a857d" }}
                formatter={(value, name) => {
                  const v = Number(value ?? 0);
                  if (name === "cost") return [`$${v.toFixed(2)}`, "APIコスト"];
                  return [v, "実行回数"];
                }}
              />
              <Bar
                yAxisId="cost"
                dataKey="cost"
                fill="#c35a2c"
                radius={[4, 4, 0, 0]}
                opacity={0.8}
                maxBarSize={40}
              />
              <Line
                yAxisId="count"
                type="monotone"
                dataKey="count"
                stroke="#6b83b0"
                strokeWidth={2}
                dot={{ fill: "#6b83b0", r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-lg border border-stone-200 bg-white py-12 text-stone-400 shadow-sm">
          <p className="text-sm">タスクが追加されるとグラフが表示されます</p>
        </div>
      )}
    </div>
  );
}
