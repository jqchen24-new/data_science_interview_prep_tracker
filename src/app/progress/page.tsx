import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Progress" };

export default async function ProgressPage() {
  let debugInfo = "start";

  try {
    debugInfo = "auth";
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return <p>Not signed in</p>;
    debugInfo = "auth ok, userId=" + userId;

    debugInfo = "importing progress";
    const { getProgressStats } = await import("@/lib/progress");
    debugInfo = "imported progress";

    const tzOffset = (await cookies()).get("tzOffset")?.value ?? null;
    debugInfo = "fetching stats";
    const stats = await getProgressStats(userId, tzOffset);
    debugInfo = "stats ok: " + JSON.stringify(Object.keys(stats));

    let achievements: unknown[] = [];
    try {
      debugInfo = "importing achievements";
      const { getUserAchievements } = await import("@/lib/achievements");
      debugInfo = "imported achievements";
      achievements = await getUserAchievements(userId);
      debugInfo = "achievements ok: " + achievements.length;
    } catch (e) {
      debugInfo = "achievements failed: " + (e instanceof Error ? e.message : String(e));
    }

    const { Card, CardTitle } = await import("@/components/ui/Card");
    const { ProgressStats } = await import("@/components/progress/ProgressStats");
    const { ProgressChartWithTasks } = await import("@/components/progress/ProgressChartWithTasks");

    const hasNoData = stats.totalMinutes === 0 && stats.completedCount === 0;

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Progress
          </h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Time and sessions by tag, plus your streak. Mark tasks as <strong>Done</strong> on Tasks or Daily Plan for them to count here.
          </p>
        </div>

        {hasNoData && (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/50 p-6 dark:border-neutral-700 dark:bg-neutral-800/30">
            <p className="text-center text-neutral-600 dark:text-neutral-400">
              Get started by completing a session — it will show up here.
            </p>
            <p className="mt-3 flex justify-center gap-4 text-sm">
              <Link
                href="/tasks"
                className="font-medium text-neutral-900 underline hover:text-neutral-700 dark:text-neutral-200 dark:hover:text-white"
              >
                Tasks
              </Link>
              <Link
                href="/plan"
                className="font-medium text-neutral-900 underline hover:text-neutral-700 dark:text-neutral-200 dark:hover:text-white"
              >
                Daily Plan
              </Link>
            </p>
          </div>
        )}

        <ProgressStats stats={stats} />

        <Card>
          <CardTitle>Time by tag</CardTitle>
          <p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
            Click a bar to see completed tasks for that tag.
          </p>
          <ProgressChartWithTasks data={stats.byTag} />
        </Card>
      </div>
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack?.slice(0, 800) : "";
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Progress
        </h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-800">Debug: {debugInfo}</p>
          <p className="mt-2 text-sm font-mono text-red-700">{msg}</p>
          <p className="mt-2 text-xs font-mono text-red-600 whitespace-pre-wrap">{stack}</p>
        </div>
      </div>
    );
  }
}
