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

  const oneDayMs = 24 * 60 * 60 * 1000;
  const daysElapsedThisWeek = Math.min(
    7,
    Math.floor((Date.now() - weekStart.getTime()) / oneDayMs) + 1
  );
  const lastWeekSamePeriodEnd = new Date(lastWeekStart);
  lastWeekSamePeriodEnd.setDate(lastWeekSamePeriodEnd.getDate() + daysElapsedThisWeek - 1);
  lastWeekSamePeriodEnd.setHours(23, 59, 59, 999);
  const lastWeekSamePeriodMinutes = tasks
    .filter(
      (t) =>
        t.completedAt &&
        t.completedAt >= lastWeekStart &&
        t.completedAt <= lastWeekSamePeriodEnd
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
    lastWeekSamePeriodMinutes,
    weeklyData,
    byTag,
    streak,
    completedCount: tasks.length,
    totalTasksCount,
    completedTasksCount,
  };
}

export type WeeklyInsight = {
  type: "positive" | "warning" | "neutral";
  text: string;
};

export async function getWeeklyInsights(userId: string): Promise<{
  insights: WeeklyInsight[];
  achievementCount: number;
  achievementTotal: number;
}> {
  const stats = await getProgressStats(userId);
  const insights: WeeklyInsight[] = [];

  // Study time comparison: this week so far vs. same number of days last week (fair at start of week)
  const lastPeriod = stats.lastWeekSamePeriodMinutes ?? stats.lastWeekMinutes;
  if (lastPeriod > 0) {
    const pct = Math.round(
      ((stats.weekMinutes - lastPeriod) / lastPeriod) * 100
    );
    if (pct > 0) {
      insights.push({
        type: "positive",
        text: `You studied ${pct}% more than the same period last week`,
      });
    } else if (pct < 0) {
      insights.push({
        type: "warning",
        text: `Study time ${Math.abs(pct)}% below the same period last week`,
      });
    } else {
      insights.push({
        type: "neutral",
        text: "Same study time as this period last week — keep it up!",
      });
    }
  } else if (stats.weekMinutes > 0) {
    insights.push({
      type: "positive",
      text: `Great start this week — ${stats.weekMinutes} min so far!`,
    });
  }

  // SQL solved this week (optional: main branch has no SqlAttempt model)
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const prismaAny = prisma as typeof prisma & { sqlAttempt?: { findMany: (args: unknown) => Promise<{ questionId: string }[]> } };
  const sqlSolvedThisWeek = prismaAny.sqlAttempt
    ? await prismaAny.sqlAttempt.findMany({
        where: {
          userId,
          passed: true,
          createdAt: { gte: weekStart },
        },
        select: { questionId: true },
        distinct: ["questionId"],
      })
    : [];
  if (sqlSolvedThisWeek.length > 0) {
    insights.push({
      type: "positive",
      text: `You solved ${sqlSolvedThisWeek.length} new SQL question${sqlSolvedThisWeek.length > 1 ? "s" : ""} this week`,
    });
  }

  // Neglected tags (7+ days without practice)
  const allTags = await prisma.tag.findMany({ where: { userId } });
  const completedTasks = await prisma.task.findMany({
    where: { userId, completedAt: { not: null } },
    include: { tags: true },
    orderBy: { completedAt: "desc" },
  });

  const lastPracticedByTag = new Map<string, Date>();
  for (const task of completedTasks) {
    for (const tt of task.tags) {
      if (!lastPracticedByTag.has(tt.tagId)) {
        lastPracticedByTag.set(tt.tagId, task.completedAt!);
      }
    }
  }

  const today = new Date();
  const neglected: { name: string; days: number }[] = [];
  for (const tag of allTags) {
    const last = lastPracticedByTag.get(tag.id);
    if (!last) {
      neglected.push({ name: tag.name, days: 999 });
    } else {
      const days = Math.floor(
        (today.getTime() - last.getTime()) / (24 * 60 * 60 * 1000)
      );
      if (days >= 7) {
        neglected.push({ name: tag.name, days });
      }
    }
  }
  neglected.sort((a, b) => b.days - a.days);
  if (neglected.length > 0) {
    const top = neglected[0];
    const dayText = top.days >= 999 ? "never practiced" : `${top.days} days ago`;
    insights.push({
      type: "warning",
      text: `You haven't practiced ${top.name} (last: ${dayText})`,
    });
  }

  // Streak at risk
  const todayStr = today.toISOString().slice(0, 10);
  const completedToday = completedTasks.some(
    (t) => t.completedAt!.toISOString().slice(0, 10) === todayStr
  );
  if (stats.streak > 0 && !completedToday) {
    insights.push({
      type: "warning",
      text: `Your ${stats.streak}-day streak is at risk — complete a task today!`,
    });
  }

  let unlockedCount = 0;
  try {
    unlockedCount = await prisma.userAchievement.count({
      where: { userId },
    });
  } catch {
    // table may not exist yet
  }

  return {
    insights: insights.slice(0, 4),
    achievementCount: unlockedCount,
    achievementTotal: (await import("./achievements")).ACHIEVEMENTS.length,
  };
}
