"use client";

import { useState } from "react";
import Link from "next/link";
import type { WeeklyInsight } from "@/lib/progress";

export function DashboardNudge({
  insights,
  streak,
}: {
  insights: WeeklyInsight[];
  streak: number;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const warningInsight = insights.find((i) => i.type === "warning");
  if (!warningInsight && streak > 0) return null;

  const message =
    warningInsight?.text ?? "Start a study session to build your streak!";

  const isStreak = message.includes("streak");

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
        isStreak
          ? "border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/30"
          : "border-blue-200 bg-blue-50 dark:border-blue-800/50 dark:bg-blue-950/30"
      }`}
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="text-lg" aria-hidden>
          {isStreak ? "🔥" : "💡"}
        </span>
        <span
          className={
            isStreak
              ? "text-amber-800 dark:text-amber-200"
              : "text-blue-800 dark:text-blue-200"
          }
        >
          {message}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/plan"
          className={`rounded-lg px-3 py-1 text-xs font-medium ${
            isStreak
              ? "bg-amber-600 text-white hover:bg-amber-700"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          Go to Plan
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="rounded p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          aria-label="Dismiss"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
