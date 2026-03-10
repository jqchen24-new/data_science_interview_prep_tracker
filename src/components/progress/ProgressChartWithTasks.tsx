"use client";

import { useState } from "react";
import Link from "next/link";
import { ProgressChartSection } from "./ProgressChartSection";
import { getCompletedTasksByTagAction } from "@/app/progress/actions";
import type { CompletedTaskForTag } from "@/app/progress/actions";
import type { TagStat } from "./TimeByTagChart";

type Props = { data: TagStat[] };

export function ProgressChartWithTasks({ data }: Props) {
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [selectedTagName, setSelectedTagName] = useState<string>("");
  const [tasks, setTasks] = useState<CompletedTaskForTag[]>([]);
  const [loading, setLoading] = useState(false);

  const handleTagClick = async (tagId: string, tagName: string) => {
    if (selectedTagId === tagId) {
      setSelectedTagId(null);
      setSelectedTagName("");
      setTasks([]);
      return;
    }
    setSelectedTagId(tagId);
    setSelectedTagName(tagName);
    setLoading(true);
    try {
      const list = await getCompletedTasksByTagAction(tagId);
      setTasks(list);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <ProgressChartSection data={data} onTagClick={handleTagClick} />
      {selectedTagId != null && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50/50 py-3 dark:border-neutral-700 dark:bg-neutral-800/30">
          <p className="mb-2 px-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Tasks for {selectedTagName}
          </p>
          {loading ? (
            <p className="px-3 text-sm text-neutral-500 dark:text-neutral-400">
              Loading…
            </p>
          ) : tasks.length === 0 ? (
            <p className="px-3 text-sm text-neutral-500 dark:text-neutral-400">
              No completed tasks for this tag.
            </p>
          ) : (
            <ul className="max-h-48 space-y-1 overflow-y-auto px-3 text-sm">
              {tasks.map((task) => {
                const completedAt = new Date(task.completedAt);
                const dateStr = completedAt.toLocaleDateString();
                const timeStr = completedAt.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const mins = task.durationMinutes ?? 30;
                return (
                  <li
                    key={task.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded py-1.5 pr-2 text-neutral-600 dark:text-neutral-400"
                  >
                    <span className="min-w-0 flex-1 truncate font-medium text-neutral-900 dark:text-white">
                      {task.title}
                    </span>
                    <span className="shrink-0 text-xs">
                      {dateStr} at {timeStr} · {mins} min
                    </span>
                    <Link
                      href={`/tasks/${task.id}`}
                      className="shrink-0 text-xs font-medium text-neutral-600 underline hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
                    >
                      View
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
