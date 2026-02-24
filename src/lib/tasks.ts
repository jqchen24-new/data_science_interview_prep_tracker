import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

export type TaskWithTags = Awaited<ReturnType<typeof getTaskById>>;
export type SuggestedItem = { tagId: string; tagName: string; tagSlug: string; suggestedMinutes: number };

export async function getTasks(filters?: {
  from?: Date;
  to?: Date;
  tagId?: string;
  completed?: boolean;
}) {
  const where: Prisma.TaskWhereInput = {};
  if (filters?.from || filters?.to) {
    where.scheduledAt = {};
    if (filters.from) (where.scheduledAt as { gte?: Date; lte?: Date }).gte = filters.from;
    if (filters.to) (where.scheduledAt as { gte?: Date; lte?: Date }).lte = filters.to;
  }
  if (filters?.completed !== undefined) {
    where.completedAt = filters.completed ? { not: null } : null;
  }
  if (filters?.tagId) {
    where.tags = { some: { tagId: filters.tagId } };
  }
  return prisma.task.findMany({
    where,
    include: { tags: { include: { tag: true } } },
    orderBy: { scheduledAt: "asc" },
  });
}

export async function getTasksForDate(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return getTasks({ from: start, to: end });
}

export async function getTaskById(id: string) {
  return prisma.task.findUnique({
    where: { id },
    include: { tags: { include: { tag: true } } },
  });
}

export async function createTask(data: {
  title: string;
  durationMinutes?: number | null;
  scheduledAt: Date;
  tagIds: string[];
}) {
  const { tagIds, ...rest } = data;
  return prisma.task.create({
    data: {
      ...rest,
      tags: { create: tagIds.map((tagId) => ({ tagId })) },
    },
    include: { tags: { include: { tag: true } } },
  });
}

export async function updateTask(
  id: string,
  data: {
    title?: string;
    durationMinutes?: number | null;
    scheduledAt?: Date;
    tagIds?: string[];
  }
) {
  if (data.tagIds !== undefined) {
    await prisma.taskTag.deleteMany({ where: { taskId: id } });
    await prisma.taskTag.createMany({
      data: data.tagIds.map((tagId) => ({ taskId: id, tagId })),
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- tagIds handled above
  const { tagIds: _tagIds, ...rest } = data;
  return prisma.task.update({
    where: { id },
    data: rest,
    include: { tags: { include: { tag: true } } },
  });
}

export async function completeTask(id: string) {
  return prisma.task.update({
    where: { id },
    data: { completedAt: new Date() },
    include: { tags: { include: { tag: true } } },
  });
}

export async function uncompleteTask(id: string) {
  return prisma.task.update({
    where: { id },
    data: { completedAt: null },
    include: { tags: { include: { tag: true } } },
  });
}

export async function deleteTask(id: string) {
  return prisma.task.delete({ where: { id } });
}

const SUGGESTED_SESSIONS = 5;
/** Each suggested session is 30 or 60 min (no odd values like 24). */
const SUGGESTED_MINUTES_PER_SESSION = 30;
const LOOKBACK_DAYS = 14;
/** Tags never practiced get this many "days ago" so they rank first */
const DAYS_IF_NEVER_PRACTICED = 999;

export async function getSuggestedPlanForDate(date: Date): Promise<SuggestedItem[]> {
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  const lookbackStart = new Date(date);
  lookbackStart.setDate(lookbackStart.getDate() - LOOKBACK_DAYS);
  lookbackStart.setHours(0, 0, 0, 0);

  // All completed tasks: used for "last practiced" (when you actually did it)
  const allCompleted = await prisma.task.findMany({
    where: { completedAt: { not: null } },
    include: { tags: { include: { tag: true } } },
  });
  // Completions in lookback window: for "minutes practiced" in last 14 days
  const completedInLookback = await prisma.task.findMany({
    where: {
      completedAt: { not: null, gte: lookbackStart },
    },
    include: { tags: { include: { tag: true } } },
  });

  const minutesByTagId = new Map<string, number>();
  const lastPracticedByTagId = new Map<string, Date>();

  for (const tag of tags) {
    minutesByTagId.set(tag.id, 0);
  }
  for (const task of completedInLookback) {
    const mins = task.durationMinutes ?? 30;
    for (const tt of task.tags) {
      const current = minutesByTagId.get(tt.tagId) ?? 0;
      minutesByTagId.set(tt.tagId, current + mins);
    }
  }
  for (const task of allCompleted) {
    const completedAt = task.completedAt!;
    for (const tt of task.tags) {
      const existing = lastPracticedByTagId.get(tt.tagId);
      if (!existing || completedAt > existing) {
        lastPracticedByTagId.set(tt.tagId, completedAt);
      }
    }
  }

  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  const sorted = [...tags]
    .map((tag) => {
      const minutes = minutesByTagId.get(tag.id) ?? 0;
      const lastPracticed = lastPracticedByTagId.get(tag.id);
      const daysSinceLastPracticed = lastPracticed
        ? Math.floor((dateOnly.getTime() - new Date(lastPracticed).setHours(0, 0, 0, 0)) / (24 * 60 * 60 * 1000))
        : DAYS_IF_NEVER_PRACTICED;
      return { tag, minutes, daysSinceLastPracticed };
    })
    .sort((a, b) => {
      if (a.daysSinceLastPracticed !== b.daysSinceLastPracticed) {
        return b.daysSinceLastPracticed - a.daysSinceLastPracticed;
      }
      return a.minutes - b.minutes;
    });

  const result: SuggestedItem[] = [];
  for (let i = 0; i < sorted.length && result.length < SUGGESTED_SESSIONS; i++) {
    const { tag } = sorted[i];
    const suggestedMinutes = SUGGESTED_MINUTES_PER_SESSION;
    result.push({
      tagId: tag.id,
      tagName: tag.name,
      tagSlug: tag.slug,
      suggestedMinutes,
    });
  }
  return result;
}
