import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const TAG_COLORS: Record<string, string> = {
  sql: "bg-blue-500",
  ml: "bg-emerald-500",
  stats: "bg-amber-500",
  python: "bg-orange-500",
  behavioral: "bg-violet-500",
};

function getTagColor(slug: string): string {
  return TAG_COLORS[slug.toLowerCase()] ?? "bg-neutral-500";
}

type Task = {
  id: string;
  title: string;
  durationMinutes: number | null;
  completedAt: Date | null;
  tags: { tag: { id: string; name: string; slug: string } }[];
};

export function DashboardTodayCard({ tasks }: { tasks: Task[] }) {
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completedAt && !b.completedAt) return 1;
    if (!a.completedAt && b.completedAt) return -1;
    return 0;
  });

  return (
    <Card>
      <CardTitle>Today</CardTitle>
      {sortedTasks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50/50 px-4 py-6 dark:border-neutral-700 dark:bg-neutral-800/30">
          <p className="mb-1 text-center text-2xl text-neutral-400 dark:text-neutral-500" aria-hidden>
            📅
          </p>
          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
            No sessions today.{" "}
            <Link
              href="/plan"
              className="font-medium text-neutral-700 underline hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
            >
              Plan your day
            </Link>{" "}
            or{" "}
            <Link
              href="/tasks"
              className="font-medium text-neutral-700 underline hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
            >
              add a task
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sortedTasks.map((task) => {
            const primaryTag = task.tags[0]?.tag;
            const tagSlug = primaryTag?.slug ?? "other";
            const duration = task.durationMinutes ?? 30;
            const isCompleted = !!task.completedAt;
            const iconLabel =
              (primaryTag?.name?.trim().slice(0, 2).toUpperCase()) ||
              (task.title?.trim().slice(0, 2).toUpperCase()) ||
              "—";

            return (
              <li
                key={task.id}
                className="flex items-center gap-3 rounded-lg border border-neutral-200 px-3 py-2.5 dark:border-neutral-700"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white ${getTagColor(tagSlug)}`}
                >
                  {iconLabel}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-neutral-900 dark:text-white">
                    {task.title}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {duration} mins
                    <span className="ml-2">
                      {isCompleted ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          Completed
                        </span>
                      ) : (
                        <span className="text-neutral-500 dark:text-neutral-400">
                          Upcoming
                        </span>
                      )}
                    </span>
                  </p>
                </div>
                <div className="shrink-0">
                  {isCompleted ? (
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                      aria-label="Completed"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>
                  ) : (
                    <Link href={`/tasks/${task.id}`}>
                      <Button className="px-3 py-1.5 text-xs">
                        Start
                      </Button>
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Link
        href="/plan"
        className="mt-3 inline-block text-sm font-medium text-neutral-700 dark:text-neutral-300"
      >
        View all sessions →
      </Link>
    </Card>
  );
}
