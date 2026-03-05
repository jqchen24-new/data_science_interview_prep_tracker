import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import type { WeeklyInsight } from "@/lib/progress";

const ICONS: Record<string, string> = {
  positive: "↑",
  warning: "⚠",
  neutral: "→",
};

const COLORS: Record<string, string> = {
  positive: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  neutral: "text-neutral-500 dark:text-neutral-400",
};

export function DashboardInsightsCard({
  insights,
  achievementCount,
  achievementTotal,
}: {
  insights: WeeklyInsight[];
  achievementCount: number;
  achievementTotal: number;
}) {
  return (
    <Card>
      <CardTitle>Weekly Insights</CardTitle>
      {insights.length === 0 ? (
        <p className="py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Complete some tasks to see personalized insights.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {insights.map((insight, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className={`mt-0.5 shrink-0 font-bold ${COLORS[insight.type]}`}>
                {ICONS[insight.type]}
              </span>
              <span className="text-neutral-700 dark:text-neutral-300">
                {insight.text}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-3 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden>🏅</span>
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            <span className="font-semibold text-neutral-900 dark:text-white">
              {achievementCount}/{achievementTotal}
            </span>{" "}
            achievements
          </span>
        </div>
        <Link
          href="/progress"
          className="text-sm font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
        >
          View all →
        </Link>
      </div>
    </Card>
  );
}
