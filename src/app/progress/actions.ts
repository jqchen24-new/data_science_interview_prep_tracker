"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const UNTAGGED_ID = "__untagged__";

export type CompletedTaskForTag = {
  id: string;
  title: string;
  durationMinutes: number | null;
  completedAt: Date;
};

export async function getCompletedTasksByTagAction(
  tagId: string
): Promise<CompletedTaskForTag[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  if (tagId === UNTAGGED_ID) {
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        completedAt: { not: null },
        tags: { none: {} },
      },
      select: { id: true, title: true, durationMinutes: true, completedAt: true },
      orderBy: { completedAt: "desc" },
    });
    return tasks.map((t) => ({
      id: t.id,
      title: t.title,
      durationMinutes: t.durationMinutes ?? null,
      completedAt: t.completedAt!,
    }));
  }

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      completedAt: { not: null },
      tags: { some: { tagId } },
    },
    select: { id: true, title: true, durationMinutes: true, completedAt: true },
    orderBy: { completedAt: "desc" },
  });
  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    durationMinutes: t.durationMinutes ?? null,
    completedAt: t.completedAt!,
  }));
}
