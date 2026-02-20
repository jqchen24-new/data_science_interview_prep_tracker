"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { createTagAction, updateTagAction, deleteTagAction } from "@/app/tags/actions";

type Tag = { id: string; name: string; slug: string };

export function TagsPageClient({
  tags,
  showList = false,
}: {
  tags: Tag[];
  showList?: boolean;
}) {
  const [state, formAction] = useActionState<{ error: string | null }, FormData>(
    async (_, formData) => createTagAction(formData),
    { error: null }
  );
  const [updateState, updateFormAction] = useActionState<{ error: string | null }, FormData>(
    async (_, formData) => updateTagAction(formData),
    { error: null }
  );
  const [editingTagId, setEditingTagId] = useState<string | null>(null);

  return (
    <>
      {!showList && (
        <form action={formAction} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          {state?.error && (
            <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
          )}
          <div className="flex-1">
            <Input label="Tag name" name="name" placeholder="e.g. System Design" required />
          </div>
          <Button type="submit">Add tag</Button>
        </form>
      )}
      {showList && (
        <div className="flex flex-col gap-3">
          {updateState?.error && (
            <p className="text-sm text-red-600 dark:text-red-400">{updateState.error}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag.id} className="inline-flex items-center gap-1.5">
                {editingTagId === tag.id ? (
                  <form
                    action={updateFormAction}
                    className="inline-flex items-center gap-1.5"
                    onSubmit={() => setEditingTagId(null)}
                  >
                    <input type="hidden" name="id" value={tag.id} />
                    <input
                      type="text"
                      name="name"
                      defaultValue={tag.name}
                      className="w-32 rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditingTagId(null);
                      }}
                    />
                    <Button type="submit" className="!py-1 !px-2 text-xs">
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="!py-1 !px-2 text-xs"
                      onClick={() => setEditingTagId(null)}
                    >
                      Cancel
                    </Button>
                  </form>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditingTagId(tag.id)}
                      title="Click to edit"
                      className="cursor-pointer rounded-md transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500"
                    >
                      <Badge>{tag.name}</Badge>
                    </button>
                    <form action={deleteTagAction} className="inline">
                      <input type="hidden" name="id" value={tag.id} />
                      <Button type="submit" variant="ghost" className="!py-0 !px-1 text-neutral-500 hover:text-red-600">
                        ×
                      </Button>
                    </form>
                  </>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
