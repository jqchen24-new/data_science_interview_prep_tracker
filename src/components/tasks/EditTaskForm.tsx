"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateTaskAction } from "@/app/tasks/actions";

type Tag = { id: string; name: string; slug: string };

function toLocalDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

export function EditTaskForm({
  taskId,
  tagOptions,
  initialTitle,
  initialDuration,
  initialScheduledAtIso,
  initialTagIds,
}: {
  taskId: string;
  tagOptions: Tag[];
  initialTitle: string;
  initialDuration: string;
  initialScheduledAtIso: string;
  initialTagIds: string[];
}) {
  const router = useRouter();
  const [scheduledValue, setScheduledValue] = useState("");
  const [state, formAction] = useActionState<{ error: string | null }, FormData>(
    async (_, formData) => {
      const raw = formData.get("scheduledAt");
      if (raw && typeof raw === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw)) {
        formData.set("scheduledAt", new Date(raw).toISOString());
      }
      return updateTaskAction(taskId, formData);
    },
    { error: null }
  );

  useEffect(() => {
    setScheduledValue(toLocalDatetimeLocal(initialScheduledAtIso));
  }, [initialScheduledAtIso]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
    >
      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      <Input
        label="Title"
        name="title"
        required
        defaultValue={initialTitle}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Date & time"
          name="scheduledAt"
          type="datetime-local"
          required
          value={scheduledValue}
          onChange={(e) => setScheduledValue(e.target.value)}
        />
        <Input
          label="Duration (minutes)"
          name="durationMinutes"
          type="number"
          min={1}
          defaultValue={initialDuration}
        />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Tags
        </p>
        <div className="flex flex-wrap gap-2">
          {tagOptions.map((tag) => (
            <label key={tag.id} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                name="tagIds"
                value={tag.id}
                defaultChecked={initialTagIds.includes(tag.id)}
                className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
              />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                {tag.name}
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit">Save changes</Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/tasks")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
