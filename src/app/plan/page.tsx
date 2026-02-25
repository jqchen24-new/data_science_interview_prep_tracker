import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getTasksForDate, getSuggestedPlanForDate } from "@/lib/tasks";
import type { SuggestedItem } from "@/lib/tasks";
import { Card, CardTitle } from "@/components/ui/Card";
import { SuggestedPlan } from "@/components/plan/SuggestedPlan";
import { SuccessBanner } from "@/components/ui/SuccessBanner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import {
  completeTaskFormAction,
  uncompleteTaskFormAction,
  deleteTaskFormAction,
} from "./actions";

export const dynamic = "force-dynamic";

type TaskWithTags = Awaited<ReturnType<typeof getTasksForDate>>[number];

async function loadPlanData(userId: string) {
  const today = new Date();
  try {
    const [todayTasks, suggested] = await Promise.all([
      getTasksForDate(userId, today),
      getSuggestedPlanForDate(userId, today),
    ]);
    return { todayTasks, suggested, error: null as string | null };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Plan data error:", e);
    return {
      todayTasks: [] as TaskWithTags[],
      suggested: [] as SuggestedItem[],
      error: message,
    };
  }
}

export default async function PlanPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const { todayTasks, suggested, error } = await loadPlanData(userId);

  // Exclude from suggestions any tag already in today's plan
  const tagIdsInTodaysPlan = new Set(
    (todayTasks ?? []).flatMap((t) => t.tags.map((tt) => tt.tagId))
  );
  const suggestedFiltered = (suggested ?? []).filter(
    (item) => !tagIdsInTodaysPlan.has(item.tagId)
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Daily Plan
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Today’s sessions and suggested practice based on your progress.
        </p>
      </div>

      <Suspense fallback={null}>
        <SuccessBanner />
      </Suspense>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="font-medium text-amber-800 dark:text-amber-200">
            Could not load some data
          </p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            {error}
          </p>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Check that the database exists and run:{" "}
            <code className="rounded bg-neutral-200 px-1 dark:bg-neutral-700">
              npx prisma migrate dev
            </code>{" "}
            and{" "}
            <code className="rounded bg-neutral-200 px-1 dark:bg-neutral-700">
              npx prisma db seed
            </code>
          </p>
        </div>
      )}

      <Card>
        <CardTitle>Suggested for today</CardTitle>
        <p className="mb-2 text-sm text-neutral-500 dark:text-neutral-400">
          Based on tags you haven’t practiced recently, then by least total time.
        </p>
        <SuggestedPlan items={suggestedFiltered} />
      </Card>

      <Card>
        <CardTitle>Today’s plan</CardTitle>
        {!todayTasks || todayTasks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-neutral-300 py-6 text-center text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
            Nothing scheduled for today. Add from suggestions above or from Tasks.
          </p>
        ) : (
          <div className="space-y-2">
            {todayTasks.map((task) => {
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
                    <form action={deleteTaskFormAction} className="inline">
                      <input type="hidden" name="taskId" value={task.id} />
                      <Button type="submit" variant="ghost">
                        Delete
                      </Button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
