"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Card, CardTitle } from "@/components/ui/Card";

const TAG_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#6b7280"];

type TagStat = { name: string; slug: string; minutes: number; count: number };
type WeekPoint = { week: string; minutes: number };

type Props = {
  weekMinutes: number;
  lastWeekMinutes: number;
  totalMinutes: number;
  streak: number;
  byTag?: TagStat[];
  weeklyData?: WeekPoint[];
  completedTasksCount: number;
  totalTasksCount: number;
};

export function DashboardProgressCard({
  weekMinutes,
  lastWeekMinutes,
  totalMinutes,
  streak,
  byTag = [],
  weeklyData = [],
  completedTasksCount,
  totalTasksCount,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const weekDiff = weekMinutes - lastWeekMinutes;
  const topTag = byTag[0];
  const pieData = byTag.slice(0, 5).map((t, i) => ({
    name: t.name,
    value: t.minutes,
    label: `${t.minutes} min ${t.name}`,
    color: TAG_COLORS[i % TAG_COLORS.length],
  }));

  return (
    <Card>
      <CardTitle>Progress</CardTitle>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {weekMinutes} min
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              This week
            </p>
            {lastWeekMinutes > 0 && (
              <p
                className={`mt-0.5 text-xs font-medium ${
                  weekDiff >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-neutral-500 dark:text-neutral-400"
                }`}
              >
                {weekDiff >= 0 ? "+" : ""}
                {weekDiff} min from last week
              </p>
            )}
          </div>
          {mounted && pieData.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="h-28 w-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={32}
                      outerRadius={48}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={pieData[i].color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number, _n: string, props: { payload?: { label?: string } }) =>
                        [props?.payload?.label ?? `${v} min`, ""]
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                {pieData.map((d, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    {d.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-start gap-6">
          <div>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">
              {totalMinutes} min
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              All-time study time
            </p>
          </div>
          {mounted && weeklyData.length > 0 && (
            <div className="h-12 w-24 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide domain={[0, "auto"]} />
                  <Tooltip
                    formatter={(v: number) => [`${v} min`, "Minutes"]}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="minutes"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <div>
            <p className="flex items-center gap-1.5 text-xl font-bold text-amber-600 dark:text-amber-400">
              <span aria-hidden>🔥</span>
              {streak} days
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {streak > 0 ? "Keep it up! You're on a roll." : "Complete a task to start a streak."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 border-t border-neutral-200 pt-3 dark:border-neutral-700">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            <span className="font-medium text-neutral-900 dark:text-white">
              Tasks completed:
            </span>{" "}
            {completedTasksCount}/{totalTasksCount}
          </p>
          {topTag && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              <span className="font-medium text-neutral-900 dark:text-white">
                Top subject:
              </span>{" "}
              {topTag.name}
            </p>
          )}
        </div>
      </div>
      <Link
        href="/progress"
        className="mt-3 inline-block text-sm font-medium text-neutral-700 dark:text-neutral-300"
      >
        View progress →
      </Link>
    </Card>
  );
}
