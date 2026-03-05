import { prisma } from "./db";

export type AchievementDef = {
  key: string;
  title: string;
  description: string;
  icon: string;
  category: "streak" | "tasks" | "sql" | "time" | "consistency";
  check: (stats: AchievementStats) => boolean;
};

export type AchievementStats = {
  streak: number;
  completedTasks: number;
  sqlSolved: number;
  totalMinutes: number;
  uniqueTagsPracticedThisWeek: number;
  totalTags: number;
};

export type UnlockedAchievement = {
  key: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  unlockedAt: Date;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  // ── Streak ────────────────────────────────────────────────
  {
    key: "streak_3",
    title: "Getting Started",
    description: "Maintain a 3-day study streak",
    icon: "🔥",
    category: "streak",
    check: (s) => s.streak >= 3,
  },
  {
    key: "streak_7",
    title: "One Week Strong",
    description: "Maintain a 7-day study streak",
    icon: "🔥",
    category: "streak",
    check: (s) => s.streak >= 7,
  },
  {
    key: "streak_14",
    title: "Two-Week Warrior",
    description: "Maintain a 14-day study streak",
    icon: "💪",
    category: "streak",
    check: (s) => s.streak >= 14,
  },
  {
    key: "streak_30",
    title: "Monthly Machine",
    description: "Maintain a 30-day study streak",
    icon: "🏆",
    category: "streak",
    check: (s) => s.streak >= 30,
  },

  // ── Tasks ─────────────────────────────────────────────────
  {
    key: "tasks_1",
    title: "First Step",
    description: "Complete your first study task",
    icon: "✅",
    category: "tasks",
    check: (s) => s.completedTasks >= 1,
  },
  {
    key: "tasks_10",
    title: "Building Momentum",
    description: "Complete 10 study tasks",
    icon: "📚",
    category: "tasks",
    check: (s) => s.completedTasks >= 10,
  },
  {
    key: "tasks_25",
    title: "Quarter Century",
    description: "Complete 25 study tasks",
    icon: "🎯",
    category: "tasks",
    check: (s) => s.completedTasks >= 25,
  },
  {
    key: "tasks_50",
    title: "Half Century",
    description: "Complete 50 study tasks",
    icon: "⭐",
    category: "tasks",
    check: (s) => s.completedTasks >= 50,
  },
  {
    key: "tasks_100",
    title: "Centurion",
    description: "Complete 100 study tasks",
    icon: "💎",
    category: "tasks",
    check: (s) => s.completedTasks >= 100,
  },

  // ── SQL ───────────────────────────────────────────────────
  {
    key: "sql_1",
    title: "SQL Beginner",
    description: "Solve your first SQL question",
    icon: "🗄️",
    category: "sql",
    check: (s) => s.sqlSolved >= 1,
  },
  {
    key: "sql_10",
    title: "SQL Practitioner",
    description: "Solve 10 SQL questions",
    icon: "📊",
    category: "sql",
    check: (s) => s.sqlSolved >= 10,
  },
  {
    key: "sql_25",
    title: "SQL Expert",
    description: "Solve 25 SQL questions",
    icon: "🧠",
    category: "sql",
    check: (s) => s.sqlSolved >= 25,
  },

  // ── Study Time ────────────────────────────────────────────
  {
    key: "time_60",
    title: "First Hour",
    description: "Study for a total of 1 hour",
    icon: "⏱️",
    category: "time",
    check: (s) => s.totalMinutes >= 60,
  },
  {
    key: "time_300",
    title: "Five Hours In",
    description: "Study for a total of 5 hours",
    icon: "⏰",
    category: "time",
    check: (s) => s.totalMinutes >= 300,
  },
  {
    key: "time_600",
    title: "Ten Hour Club",
    description: "Study for a total of 10 hours",
    icon: "🕐",
    category: "time",
    check: (s) => s.totalMinutes >= 600,
  },
  {
    key: "time_1500",
    title: "Dedicated Scholar",
    description: "Study for a total of 25 hours",
    icon: "📖",
    category: "time",
    check: (s) => s.totalMinutes >= 1500,
  },

  // ── Consistency ───────────────────────────────────────────
  {
    key: "all_tags_week",
    title: "Well-Rounded",
    description: "Practice every tag in a single week",
    icon: "🌟",
    category: "consistency",
    check: (s) => s.totalTags > 0 && s.uniqueTagsPracticedThisWeek >= s.totalTags,
  },
];

async function getAchievementStats(userId: string): Promise<AchievementStats> {
  const [completedTasks, totalMinutesResult, sqlSolved, totalTags, weekTagIds, streakData] =
    await Promise.all([
      prisma.task.count({ where: { userId, completedAt: { not: null } } }),

      prisma.task.aggregate({
        where: { userId, completedAt: { not: null } },
        _sum: { durationMinutes: true },
      }),

      prisma.sqlAttempt
        ? prisma.sqlAttempt.findMany({
            where: { userId, passed: true },
            select: { questionId: true },
            distinct: ["questionId"],
          })
        : Promise.resolve([] as { questionId: string }[]),

      prisma.tag.count({ where: { userId } }),

      // Tags practiced this week (Sun-Sat)
      (async () => {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const tasks = await prisma.task.findMany({
          where: { userId, completedAt: { not: null, gte: weekStart } },
          include: { tags: true },
        });
        const tagIds = new Set<string>();
        for (const t of tasks) {
          for (const tt of t.tags) tagIds.add(tt.tagId);
        }
        return tagIds;
      })(),

      // Streak calculation
      (async () => {
        const tasks = await prisma.task.findMany({
          where: { userId, completedAt: { not: null } },
          select: { completedAt: true },
        });
        const dates = [
          ...new Set(tasks.map((t) => t.completedAt!.toISOString().slice(0, 10))),
        ].sort();
        let streak = 0;
        if (dates.length > 0) {
          let d = new Date().toISOString().slice(0, 10);
          while (dates.includes(d)) {
            streak++;
            const next = new Date(d);
            next.setDate(next.getDate() - 1);
            d = next.toISOString().slice(0, 10);
          }
        }
        return streak;
      })(),
    ]);

  const rawMinutes = totalMinutesResult._sum.durationMinutes ?? 0;
  const defaultMinutes = completedTasks * 30;
  const totalMinutes = rawMinutes > 0 ? rawMinutes : defaultMinutes;

  return {
    streak: streakData,
    completedTasks,
    sqlSolved: sqlSolved.length,
    totalMinutes,
    uniqueTagsPracticedThisWeek: weekTagIds.size,
    totalTags,
  };
}

/**
 * Check all achievements and unlock any newly earned ones.
 * Returns the list of newly unlocked achievements (for toast display).
 */
export async function checkAndUnlockAchievements(
  userId: string
): Promise<UnlockedAchievement[]> {
  const [stats, existing] = await Promise.all([
    getAchievementStats(userId),
    prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementKey: true },
    }),
  ]);

  const alreadyUnlocked = new Set(existing.map((a) => a.achievementKey));
  const newlyUnlocked: UnlockedAchievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (alreadyUnlocked.has(achievement.key)) continue;
    if (!achievement.check(stats)) continue;

    const record = await prisma.userAchievement.create({
      data: { userId, achievementKey: achievement.key },
    });

    newlyUnlocked.push({
      key: achievement.key,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      category: achievement.category,
      unlockedAt: record.unlockedAt,
    });
  }

  return newlyUnlocked;
}

/** Get all achievements with unlock status for a user. */
export async function getUserAchievements(userId: string) {
  const unlocked = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementKey: true, unlockedAt: true },
  });

  const unlockedMap = new Map(unlocked.map((a) => [a.achievementKey, a.unlockedAt]));

  return ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: unlockedMap.has(a.key),
    unlockedAt: unlockedMap.get(a.key) ?? null,
  }));
}
