"use client";

import { Card, CardTitle } from "@/components/ui/Card";

type Achievement = {
  key: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  unlocked: boolean;
  unlockedAt: Date | string | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  streak: "Streaks",
  tasks: "Tasks",
  sql: "SQL Practice",
  time: "Study Time",
  consistency: "Consistency",
};

export function AchievementsGrid({
  achievements,
}: {
  achievements: Achievement[];
}) {
  const unlocked = achievements.filter((a) => a.unlocked).length;
  const total = achievements.length;

  const categories = Object.keys(CATEGORY_LABELS);
  const grouped = categories
    .map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      items: achievements.filter((a) => a.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Achievements</CardTitle>
        <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
          {unlocked}/{total} unlocked
        </span>
      </div>

      <div className="mt-1 mb-4 h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
        <div
          className="h-full rounded-full bg-amber-500 transition-all"
          style={{ width: `${total > 0 ? (unlocked / total) * 100 : 0}%` }}
        />
      </div>

      <div className="space-y-6">
        {grouped.map((group) => (
          <div key={group.category}>
            <h3 className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              {group.label}
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {group.items.map((a) => (
                <div
                  key={a.key}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition ${
                    a.unlocked
                      ? "border-amber-200 bg-amber-50/50 dark:border-amber-800/50 dark:bg-amber-900/20"
                      : "border-neutral-200 bg-neutral-50 opacity-50 dark:border-neutral-700 dark:bg-neutral-800/50"
                  }`}
                  title={a.unlocked && a.unlockedAt
                    ? `Unlocked ${new Date(a.unlockedAt).toLocaleDateString()}`
                    : "Locked"}
                >
                  <span className="text-2xl" aria-hidden>
                    {a.unlocked ? a.icon : "🔒"}
                  </span>
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                    {a.title}
                  </span>
                  <span className="text-[10px] leading-tight text-neutral-500 dark:text-neutral-400">
                    {a.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
