"use client";

import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export type TagStat = { name: string; slug: string; minutes: number; count: number };

export type TimeByTagChartProps = { data?: TagStat[] };

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#6b7280"];

export function TimeByTagChart({ data = [] }: TimeByTagChartProps) {
  const safeData = Array.isArray(data) ? data : [];
  if (safeData.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50/50 py-8 dark:border-neutral-700 dark:bg-neutral-800/30">
        <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
          No data yet. Complete sessions to see time by tag.
        </p>
        <p className="mt-2 text-center text-sm">
          <Link
            href="/tasks"
            className="font-medium text-neutral-700 underline hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
          >
            Tasks
          </Link>
          {" · "}
          <Link
            href="/plan"
            className="font-medium text-neutral-700 underline hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
          >
            Daily Plan
          </Link>
        </p>
      </div>
    );
  }

  const chartData = safeData.map((d) => ({
    name: d.name ?? "?",
    minutes: Number(d.minutes) || 0,
  }));

  return (
    <div className="h-64 w-full min-h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
          layout="vertical"
        >
          <XAxis type="number" tickFormatter={(v) => `${v} min`} />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fontSize: 12 }}
            interval={0}
          />
          <Tooltip
            formatter={(value: number) => [`${value} min`, "Minutes"]}
            labelFormatter={(label) => label}
          />
          <Bar dataKey="minutes" radius={[0, 4, 4, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
