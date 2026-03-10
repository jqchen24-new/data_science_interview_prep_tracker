"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Task } from "@/app/tasks/actions";

type TaskWithTags = Task & { tags: { tag: { id: string; name: string; slug: string } }[] };

export function TaskCard({
  task,
  onComplete,
  onUncomplete,
  onDelete,
  editPathPrefix,
}: {
  task: TaskWithTags;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onDelete: (id: string) => void;
  editPathPrefix?: string;
}) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const completed = !!task.completedAt;
  const scheduled = new Date(task.scheduledAt);
  const timeStr = scheduled.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = scheduled.toLocaleDateString();

  const handleConfirmDelete = () => {
    onDelete(task.id);
  };

  return (
    <div
      className={`rounded-xl border p-4 ${
        completed
          ? "border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50"
          : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p
            className={`font-medium text-neutral-900 dark:text-white ${
              completed ? "line-through opacity-70" : ""
            }`}
          >
            {task.title}
          </p>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {dateStr} at {timeStr}
            {task.durationMinutes != null && ` · ${task.durationMinutes} min`}
          </p>
          {task.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {task.tags.map((tt) => (
                <Badge key={tt.tag.id}>{tt.tag.name}</Badge>
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
          {editPathPrefix && (
            <Link href={`${editPathPrefix}/${task.id}`}>
              <Button variant="ghost" type="button">
                Edit
              </Button>
            </Link>
          )}
          <Button variant="ghost" onClick={() => setDeleteConfirmOpen(true)}>
            Delete
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete task?"
        description="This cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
}
