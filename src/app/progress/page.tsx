import { auth } from "@/lib/auth";
import { getProgressStats } from "@/lib/progress";
import { getUserAchievements } from "@/lib/achievements";
import { Card, CardTitle } from "@/components/ui/Card";
import { ProgressStats } from "@/components/progress/ProgressStats";
import { ProgressChartSection } from "@/components/progress/ProgressChartSection";
import { AchievementsGrid } from "@/components/progress/AchievementsGrid";

export const dynamic = "force-dynamic";
export const metadata = { title: "Progress" };

export default async function ProgressPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  let stats: Awaited<ReturnType<typeof getProgressStats>> | null = null;
  let achievements: Awaited<ReturnType<typeof getUserAchievements>> = [];
  let loadError: string | null = null;

  try {
    stats = await getProgressStats(userId);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Failed to load progress data";
  }

  try {
    achievements = await getUserAchievements(userId);
  } catch {
    // achievements table may not exist yet
  }

  if (loadError || !stats) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Progress
        </h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/40">
          <p className="font-medium text-red-800 dark:text-red-200">
            Something went wrong
          </p>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            {loadError ?? "Could not load your data."}
          </p>
        </div>
      </div>
    );
  }

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

      <ProgressStats stats={stats} />

      {achievements.length > 0 && (
        <AchievementsGrid achievements={achievements} />
      )}

      <Card>
        <CardTitle>Time by tag</CardTitle>
        <ProgressChartSection data={stats.byTag} />
      </Card>
    </div>
  );
}
