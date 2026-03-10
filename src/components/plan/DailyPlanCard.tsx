"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Task } from "@/app/tasks/actions";
import Link from "next/link";

type TaskWithTags = Task;

export function DailyPlanCard({
  task,
  onComplete,
  onUncomplete,
  onDelete,
}: {
  task: TaskWithTags;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const completed = !!task.completedAt;
  const scheduled = task.scheduledAt ? new Date(task.scheduledAt) : new Date();
  const timeStr = Number.isNaN(scheduled.getTime()) ? "–" : scheduled.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const tags = Array.isArray(task.tags) ? task.tags : [];

  return (
    <div
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
            {tags.map((tt, i) => (
              <Badge key={tt.tagId ?? tt.tag?.id ?? `t-${i}`}>{tt.tag?.name ?? "?"}</Badge>
            ))}
          </div>
        )}
      </div>
      <div className="flex shrink-0 gap-1">
        {completed ? (
          <Button variant="ghost" onClick={() => onUncomplete(task.id)}>
            Undo
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => onComplete(task.id)}>
            Done
          </Button>
        )}
        <Link href={`/tasks/${task.id}`}>
          <Button variant="ghost">Edit</Button>
        </Link>
        <Button variant="ghost" onClick={() => setDeleteConfirmOpen(true)}>
          Delete
        </Button>
      </div>
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => onDelete(task.id)}
        title="Delete task?"
        description="This cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
}
