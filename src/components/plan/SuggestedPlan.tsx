import Link from "next/link";
import { addSuggestedToTodayAction } from "@/app/plan/actions";
import type { SuggestedItem } from "@/lib/tasks";
import { Button } from "@/components/ui/Button";

export function SuggestedPlan({ items = [] }: { items?: SuggestedItem[] }) {
  const list = Array.isArray(items) ? items : [];
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
            <form action={addSuggestedToTodayAction} className="inline-flex items-center gap-2">
              <input type="hidden" name="tagId" value={item.tagId} />
              <input type="hidden" name="tagName" value={item.tagName} />
              <input type="hidden" name="suggestedMinutes" value={item.suggestedMinutes} />
              <span className="text-neutral-700 dark:text-neutral-300">
                {item.suggestedMinutes} min <strong>{item.tagName}</strong>
              </span>
              <Button type="submit" variant="secondary" className="!py-1 !px-2 text-xs">
                Add to today
              </Button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
