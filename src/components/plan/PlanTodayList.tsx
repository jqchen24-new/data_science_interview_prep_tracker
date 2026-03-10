"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getPlanTodayTasksAction, type PlanTodayTask } from "@/app/plan/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  completeTaskFormAction,
  uncompleteTaskFormAction,
} from "@/app/plan/actions";
import { PlanTaskDeleteButton } from "@/app/plan/PlanTaskDeleteButton";

function getLocalDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function PlanTodayList() {
  const [tasks, setTasks] = useState<PlanTodayTask[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const searchParams = useSearchParams();

  useEffect(() => {
    getPlanTodayTasksAction(getLocalDateString()).then(setTasks);
  }, [searchParams, refreshKey]);

  useEffect(() => {
    function handleRefresh() {
      setRefreshKey((k) => k + 1);
    }
    window.addEventListener("plan-today-refresh", handleRefresh);
    return () => window.removeEventListener("plan-today-refresh", handleRefresh);
  }, []);

  if (tasks === null) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 py-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
        Loading…
      </p>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 py-6 dark:border-neutral-700">
        <p className="text-center text-neutral-500 dark:text-neutral-400">
          Nothing scheduled for today. Add from suggestions above or from{" "}
          <Link
            href="/tasks"
            className="font-medium text-neutral-700 underline hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
          >
            Tasks
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const completed = !!task.completedAt;
        const scheduled = new Date(task.scheduledAt);
        const timeStr = Number.isNaN(scheduled.getTime())
          ? "–"
          : scheduled.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const tags = Array.isArray(task.tags) ? task.tags : [];
        return (
          <div
            key={task.id}
            className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-3 ${
              completed
                ? "border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50"
                : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className={`font-medium ${completed ? "line-through opacity-70" : ""}`}>
                {task.title}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {timeStr}
                {task.durationMinutes != null && ` · ${task.durationMinutes} min`}
              </p>
              {tags.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {tags.map((tt) => (
                    <Badge key={tt.tag?.id ?? tt.tagId}>{tt.tag?.name ?? "?"}</Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex shrink-0 gap-1">
              {completed ? (
                <form action={uncompleteTaskFormAction}>
                  <input type="hidden" name="taskId" value={task.id} />
                  <Button type="submit" variant="ghost">
                    Undo
                  </Button>
                </form>
              ) : (
                <form action={completeTaskFormAction}>
                  <input type="hidden" name="taskId" value={task.id} />
                  <Button type="submit" variant="secondary">
                    Done
                  </Button>
                </form>
              )}
              <Link href={`/tasks/${task.id}`}>
                <Button type="button" variant="ghost">
                  Edit
                </Button>
              </Link>
              <PlanTaskDeleteButton taskId={task.id} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
