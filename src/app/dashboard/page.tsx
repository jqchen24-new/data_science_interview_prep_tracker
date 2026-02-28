import Link from "next/link";
import { auth } from "@/lib/auth";
import { getProgressStats } from "@/lib/progress";
import { DashboardTodayCardClient } from "@/components/dashboard/DashboardTodayCardClient";
import { DashboardProgressCard } from "@/components/dashboard/DashboardProgressCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Dashboard
        </h1>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="font-medium text-amber-800 dark:text-amber-200">
            Could not load your session
          </p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            Sign out and sign in again with Google to fix this.
          </p>
          <Link
            href="/api/auth/signout"
            className="mt-3 inline-block text-sm font-medium text-amber-800 underline dark:text-amber-200"
          >
            Sign out
          </Link>
        </div>
      </div>
    );
  }

  let stats: Awaited<ReturnType<typeof getProgressStats>> | null = null;
  let loadError: string | null = null;

  try {
    stats = await getProgressStats(userId);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Failed to load dashboard data";
  }

  if (loadError || !stats) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Dashboard
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

  const serverToday = new Date();
  const serverStart = new Date(serverToday);
  serverStart.setHours(0, 0, 0, 0);
  const serverEnd = new Date(serverToday);
  serverEnd.setHours(23, 59, 59, 999);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Today&apos;s plan and your progress at a glance.
        </p>
        <p className="mt-3 max-w-2xl text-sm text-neutral-500 dark:text-neutral-400">
          The Offer Lab helps you track study sessions, plan your day, and manage job applications—so you can stay on top of your interview prep.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardTodayCardClient
          serverTodayStartIso={serverStart.toISOString()}
          serverTodayEndIso={serverEnd.toISOString()}
        />
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
