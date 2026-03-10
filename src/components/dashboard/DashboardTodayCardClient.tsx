"use client";

import { useEffect, useState } from "react";
import { getTodayTasksForRange, type TodayTask } from "@/app/dashboard/actions";
import { DashboardTodayCard } from "./DashboardTodayCard";

export function DashboardTodayCardClient({
  serverTodayStartIso,
  serverTodayEndIso,
}: {
  serverTodayStartIso: string;
  serverTodayEndIso: string;
}) {
  const [tasks, setTasks] = useState<TodayTask[] | null>(null);

  useEffect(() => {
    getTodayTasksForRange(serverTodayStartIso, serverTodayEndIso).then(
      setTasks
    );
  }, [serverTodayStartIso, serverTodayEndIso]);

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
