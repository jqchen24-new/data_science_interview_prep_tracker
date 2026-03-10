import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { getProgressStats, getWeeklyInsights } from "@/lib/progress";
import { DashboardTodayCardClient } from "@/components/dashboard/DashboardTodayCardClient";
import { DashboardProgressCard } from "@/components/dashboard/DashboardProgressCard";
import { DashboardInsightsCard } from "@/components/dashboard/DashboardInsightsCard";
import { DashboardNudge } from "@/components/dashboard/DashboardNudge";

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
  let insightsData: Awaited<ReturnType<typeof getWeeklyInsights>> | null = null;
  let loadError: string | null = null;

  const tzOffset = (await cookies()).get("tzOffset")?.value ?? null;

  try {
    [stats, insightsData] = await Promise.all([
      getProgressStats(userId, tzOffset),
      getWeeklyInsights(userId, tzOffset),
    ]);
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

  // "Today" in user's timezone so yesterday's tasks don't appear (use tzOffset when available)
  const tzOffsetNum = tzOffset != null ? parseInt(tzOffset, 10) : NaN;
  const useTz =
    !Number.isNaN(tzOffsetNum) && Math.abs(tzOffsetNum) <= 60 * 14;
  let todayStartIso: string;
  let todayEndIso: string;
  if (useTz) {
    const now = Date.now();
    const localMoment = new Date(now - tzOffsetNum * 60000);
    const localDate = localMoment.getUTCDate();
    const localMonth = localMoment.getUTCMonth();
    const localYear = localMoment.getUTCFullYear();
    const dayStart = new Date(
      Date.UTC(localYear, localMonth, localDate, 0, 0, 0, 0)
    );
    const dayEnd = new Date(
      Date.UTC(localYear, localMonth, localDate, 23, 59, 59, 999)
    );
    todayStartIso = new Date(
      dayStart.getTime() + tzOffsetNum * 60000
    ).toISOString();
    todayEndIso = new Date(
      dayEnd.getTime() + tzOffsetNum * 60000
    ).toISOString();
  } else {
    const serverToday = new Date();
    const start = new Date(serverToday);
    start.setHours(0, 0, 0, 0);
    const end = new Date(serverToday);
    end.setHours(23, 59, 59, 999);
    todayStartIso = start.toISOString();
    todayEndIso = end.toISOString();
  }

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

      {insightsData && (
        <DashboardNudge insights={insightsData.insights} streak={stats.streak} />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardTodayCardClient
          serverTodayStartIso={todayStartIso}
          serverTodayEndIso={todayEndIso}
        />
        <DashboardProgressCard
          weekMinutes={stats.weekMinutes}
          lastWeekMinutes={stats.lastWeekMinutes}
          lastWeekSamePeriodMinutes={stats.lastWeekSamePeriodMinutes}
          totalMinutes={stats.totalMinutes}
          streak={stats.streak}
          byTag={stats.byTag}
          weeklyData={stats.weeklyData}
          completedTasksCount={stats.completedTasksCount}
          totalTasksCount={stats.totalTasksCount}
        />
      </div>

      {insightsData && (
        <DashboardInsightsCard
          insights={insightsData.insights}
          achievementCount={insightsData.achievementCount}
          achievementTotal={insightsData.achievementTotal}
        />
      )}
    </div>
  );
}
