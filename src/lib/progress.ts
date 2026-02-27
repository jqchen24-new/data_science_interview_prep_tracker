import { prisma } from "./db";

export async function getProgressStats(userId: string) {
  const tasks = await prisma.task.findMany({
    where: { userId, completedAt: { not: null } },
    include: { tags: { include: { tag: true } } },
  });

  const UNTAGGED_ID = "__untagged__";
  let totalMinutes = 0;
  const byTagId = new Map<string, { name: string; slug: string; minutes: number; count: number }>();

  for (const task of tasks) {
    const mins = task.durationMinutes ?? 30;
    totalMinutes += mins;
    if (task.tags.length === 0) {
      const cur = byTagId.get(UNTAGGED_ID) ?? { name: "Untagged", slug: "untagged", minutes: 0, count: 0 };
      cur.minutes += mins;
      cur.count += 1;
      byTagId.set(UNTAGGED_ID, cur);
    } else {
      for (const tt of task.tags) {
        const t = tt.tag;
        const cur = byTagId.get(t.id) ?? { name: t.name, slug: t.slug, minutes: 0, count: 0 };
        cur.minutes += mins;
        cur.count += 1;
        byTagId.set(t.id, cur);
      }
    }
  }

  const byTag = Array.from(byTagId.values()).sort((a, b) => b.minutes - a.minutes);

  const completedDates = [...new Set(tasks.map((t) => t.completedAt!.toISOString().slice(0, 10)))].sort();
  let streak = 0;
  if (completedDates.length > 0) {
    const today = new Date().toISOString().slice(0, 10);
    let d = today;
    while (completedDates.includes(d)) {
      streak++;
      const next = new Date(d);
      next.setDate(next.getDate() - 1);
      d = next.toISOString().slice(0, 10);
    }
  }

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  const weekMinutes = tasks
    .filter((t) => t.completedAt && t.completedAt >= weekStart && t.completedAt <= weekEnd)
    .reduce((sum, t) => sum + (t.durationMinutes ?? 30), 0);

  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(lastWeekStart);
  lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);
  lastWeekEnd.setHours(23, 59, 59, 999);
  const lastWeekMinutes = tasks
    .filter(
      (t) =>
        t.completedAt &&
        t.completedAt >= lastWeekStart &&
        t.completedAt <= lastWeekEnd
    )
    .reduce((sum, t) => sum + (t.durationMinutes ?? 30), 0);

  const weeklyData: { week: string; minutes: number }[] = [];
  for (let i = 3; i >= 0; i--) {
    const ws = new Date(weekStart);
    ws.setDate(ws.getDate() - 7 * i);
    const we = new Date(ws);
    we.setDate(we.getDate() + 6);
    we.setHours(23, 59, 59, 999);
    const mins = tasks
      .filter(
        (t) => t.completedAt && t.completedAt >= ws && t.completedAt <= we
      )
      .reduce((sum, t) => sum + (t.durationMinutes ?? 30), 0);
    weeklyData.push({
      week: i === 0 ? "This" : `${i}w`,
      minutes: mins,
    });
  }

  const [totalTasksCount, completedTasksCount] = await Promise.all([
    prisma.task.count({ where: { userId } }),
    prisma.task.count({ where: { userId, completedAt: { not: null } } }),
  ]);

  return {
    totalMinutes,
    weekMinutes,
    lastWeekMinutes,
    weeklyData,
    byTag,
    streak,
    completedCount: tasks.length,
    totalTasksCount,
    completedTasksCount,
  };
}
