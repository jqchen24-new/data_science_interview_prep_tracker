"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { addSuggestedToTodayAction } from "@/app/plan/actions";
import type { SuggestedItem } from "@/lib/tasks";
import { Button } from "@/components/ui/Button";

function getLocalDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function SuggestedPlan({ items = [] }: { items?: SuggestedItem[] }) {
  const router = useRouter();
  const [removedTagIds, setRemovedTagIds] = useState<Set<string>>(new Set());
  const [pendingTagId, setPendingTagId] = useState<string | null>(null);
  const rawList = Array.isArray(items) ? items : [];
  const list = rawList.filter((item) => !removedTagIds.has(item.tagId));
  const forDate = getLocalDateString();

  async function handleAddToToday(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const tagId = (formData.get("tagId") as string) ?? "";
    setPendingTagId(tagId);
    try {
      const result = await addSuggestedToTodayAction(formData);
      if (result.ok) {
        setRemovedTagIds((prev) => new Set(prev).add(tagId));
        window.dispatchEvent(new Event("plan-today-refresh"));
        router.refresh();
      }
    } finally {
      setPendingTagId(null);
    }
  }

  if (list.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50/50 px-4 py-6 dark:border-neutral-700 dark:bg-neutral-800/30">
        <p className="mb-1 text-center text-2xl text-neutral-400 dark:text-neutral-500" aria-hidden>
          💡
        </p>
        <p className="mb-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
          No suggestions right now. Add tags and complete some sessions to get suggestions.
        </p>
        <div className="flex justify-center">
          <Link href="/tags">
            <Button type="button" variant="secondary" className="text-sm">
              Go to Tags to add tags
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {list.map((item) => (
          <li key={item.tagId}>
            <form onSubmit={handleAddToToday} className="inline-flex items-center gap-2">
              <input type="hidden" name="tagId" value={item.tagId} />
              <input type="hidden" name="tagName" value={item.tagName} />
              <input type="hidden" name="suggestedMinutes" value={item.suggestedMinutes} />
              <input type="hidden" name="forDate" value={forDate} />
              <span className="text-neutral-700 dark:text-neutral-300">
                {item.suggestedMinutes} min <strong>{item.tagName}</strong>
              </span>
              <Button
                type="submit"
                variant="secondary"
                className="!py-1 !px-2 text-xs"
                disabled={pendingTagId === item.tagId}
              >
                {pendingTagId === item.tagId ? "Adding…" : "Add to today"}
              </Button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
