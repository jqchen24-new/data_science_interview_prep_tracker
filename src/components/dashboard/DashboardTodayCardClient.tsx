"use client";

import { useEffect, useState } from "react";
import { getTodayTasksForRange, type TodayTask } from "@/app/dashboard/actions";
import { DashboardTodayCard } from "./DashboardTodayCard";

/** Get start and end of local "today" as ISO strings (UTC) for the server query. */
function getLocalTodayRange(): { startIso: string; endIso: string } {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export function DashboardTodayCardClient() {
  const [tasks, setTasks] = useState<TodayTask[] | null>(null);

  useEffect(() => {
    const { startIso, endIso } = getLocalTodayRange();
    getTodayTasksForRange(startIso, endIso).then(setTasks);
  }, []);

  if (tasks === null) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          Today
        </h2>
        <p className="py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Loading…
        </p>
      </div>
    );
  }

  return <DashboardTodayCard tasks={tasks} />;
}
