import { getTasksForDate } from "@/lib/tasks";
import { getProgressStats } from "@/lib/progress";
import { DashboardTodayCard } from "@/components/dashboard/DashboardTodayCard";
import { DashboardProgressCard } from "@/components/dashboard/DashboardProgressCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const today = new Date();
  const [todayTasks, stats] = await Promise.all([
    getTasksForDate(today),
    getProgressStats(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Today&apos;s plan and your progress at a glance.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardTodayCard tasks={todayTasks} />
        <DashboardProgressCard
          weekMinutes={stats.weekMinutes}
          lastWeekMinutes={stats.lastWeekMinutes}
          totalMinutes={stats.totalMinutes}
          streak={stats.streak}
          byTag={stats.byTag}
          weeklyData={stats.weeklyData}
          completedTasksCount={stats.completedTasksCount}
          totalTasksCount={stats.totalTasksCount}
        />
      </div>
    </div>
  );
}
