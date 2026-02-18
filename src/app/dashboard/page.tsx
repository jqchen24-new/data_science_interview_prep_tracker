import Link from "next/link";
import { getTasksForDate } from "@/lib/tasks";
import { getProgressStats } from "@/lib/progress";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const today = new Date();
  const [todayTasks, stats] = await Promise.all([
    getTasksForDate(today),
    getProgressStats(),
  ]);
  const nextTasks = todayTasks.filter((t) => !t.completedAt).slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Today's plan and your progress at a glance.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardTitle>Today</CardTitle>
          {nextTasks.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No upcoming sessions.{" "}
              <Link href="/plan" className="text-neutral-700 underline dark:text-neutral-300">
                Plan your day
              </Link>{" "}
              or{" "}
              <Link href="/tasks" className="text-neutral-700 underline dark:text-neutral-300">
                add a task
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-2">
              {nextTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700"
                >
                  <span className="truncate font-medium">{task.title}</span>
                  <div className="flex shrink-0 items-center gap-2">
                    {task.tags.slice(0, 2).map((tt) => (
                      <Badge key={tt.tag.id}>{tt.tag.name}</Badge>
                    ))}
                    <Link href={`/tasks/${task.id}`}>
                      <Button variant="ghost" className="!py-1 !px-2 text-xs">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link href="/plan" className="mt-3 inline-block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            View full plan →
          </Link>
        </Card>

        <Card>
          <CardTitle>Progress</CardTitle>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500 dark:text-neutral-400">This week</dt>
              <dd className="font-medium">{stats.weekMinutes} min</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500 dark:text-neutral-400">Total</dt>
              <dd className="font-medium">{stats.totalMinutes} min</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500 dark:text-neutral-400">Streak</dt>
              <dd className="font-medium">{stats.streak} days</dd>
            </div>
          </dl>
          <Link href="/progress" className="mt-3 inline-block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            View progress →
          </Link>
        </Card>
      </div>
    </div>
  );
}
