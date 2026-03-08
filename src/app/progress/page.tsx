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
    const { ProgressChartSection } = await import("@/components/progress/ProgressChartSection");

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

        <Card>
          <CardTitle>Time by tag</CardTitle>
          <ProgressChartSection data={stats.byTag} />
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
