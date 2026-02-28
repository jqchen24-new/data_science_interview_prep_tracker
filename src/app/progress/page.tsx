import { auth } from "@/lib/auth";
import { getProgressStats } from "@/lib/progress";
import { Card, CardTitle } from "@/components/ui/Card";
import { ProgressStats } from "@/components/progress/ProgressStats";
import { ProgressChartSection } from "@/components/progress/ProgressChartSection";

export const dynamic = "force-dynamic";
export const metadata = { title: "Progress" };

export default async function ProgressPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const stats = await getProgressStats(userId);

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
}
