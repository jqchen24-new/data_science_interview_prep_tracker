"use server";

import { auth } from "@/lib/auth";
import { getTasksForTodayDashboardWithRange } from "@/lib/tasks";

export type TodayTask = Awaited<
  ReturnType<typeof getTasksForTodayDashboardWithRange>
>[number];

/** Fetch today's tasks for the given UTC date range (client's local "today"). */
export async function getTodayTasksForRange(
  startIso: string,
  endIso: string
): Promise<TodayTask[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
  return getTasksForTodayDashboardWithRange(session.user.id, start, end);
}
