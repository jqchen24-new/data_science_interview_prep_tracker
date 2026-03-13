import { NextResponse } from "next/server";
import { getProgressStats, getWeeklyInsights } from "@/lib/progress";
import { requireAuth } from "../require-auth";

export async function GET(request: Request) {
  const [err, user] = await requireAuth(request);
  if (err) return err;

  const { searchParams } = new URL(request.url);
  const tzOffset = searchParams.get("tzOffset") ?? null;

  const [stats, insightsData] = await Promise.all([
    getProgressStats(user!.id, tzOffset),
    getWeeklyInsights(user!.id, tzOffset),
  ]);

  return NextResponse.json({
    totalMinutes: stats.totalMinutes,
    weekMinutes: stats.weekMinutes,
    lastWeekMinutes: stats.lastWeekMinutes,
    lastWeekSamePeriodMinutes: stats.lastWeekSamePeriodMinutes,
    weeklyData: stats.weeklyData,
    byTag: stats.byTag,
    streak: stats.streak,
    totalTasksCount: stats.totalTasksCount,
    completedTasksCount: stats.completedTasksCount,
    insights: insightsData.insights,
    achievementCount: insightsData.achievementCount,
    achievementTotal: insightsData.achievementTotal,
  });
}
