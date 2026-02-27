"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { updateProfessionAction } from "./actions";
import { Button } from "@/components/ui/Button";
import type { ProfessionOption } from "@/lib/profession-config";

export function SettingsForm({
  professionOptions,
  currentProfession,
  updateAction,
  addDefaultTagsAction,
}: {
  professionOptions: ProfessionOption[];
  currentProfession: string;
  updateAction: (formData: FormData) => Promise<{ error: string | null }>;
  addDefaultTagsAction: () => Promise<{ error: string | null }>;
}) {
  const [state, formAction] = useFormState(
    async (_: { error: string | null }, formData: FormData) => updateAction(formData),
    { error: null as string | null }
  );

  const [addTagsState, setAddTagsState] = useState<{ error: string | null }>({ error: null });
  const [addTagsPending, setAddTagsPending] = useState(false);

  async function handleAddDefaultTags() {
    setAddTagsPending(true);
    setAddTagsState({ error: null });
    const result = await addDefaultTagsAction();
    setAddTagsState(result);
    setAddTagsPending(false);
  }

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-3">
        <select
          name="profession"
          defaultValue={currentProfession || undefined}
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
        >
          <option value="">Not set</option>
          {professionOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        {state?.error && (
          <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
        )}
        <Button type="submit">
          Save track
        </Button>
      </form>

      <div className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
        <p className="mb-2 text-sm text-neutral-600 dark:text-neutral-400">
          Add default tags for your current track (existing tags are kept).
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={handleAddDefaultTags}
          disabled={addTagsPending}
        >
          {addTagsPending ? "Adding…" : "Add default tags for this track"}
        </Button>
        {addTagsState?.error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {addTagsState.error}
          </p>
        )}
      </div>
    </div>
  );
}
