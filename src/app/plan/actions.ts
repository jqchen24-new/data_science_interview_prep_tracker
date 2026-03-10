"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createTask, completeTask, uncompleteTask, deleteTask, getTasks } from "@/lib/tasks";
import { checkAndUnlockAchievements } from "@/lib/achievements";

export type PlanTodayTask = Awaited<ReturnType<typeof getTasks>>[number];

export type AddToTodayResult = { ok: true } | { ok: false; error?: string };

export async function addSuggestedToTodayAction(formData: FormData): Promise<AddToTodayResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const tagId = formData.get("tagId") as string;
  const tagName = formData.get("tagName") as string;
  const suggestedMinutes = parseInt(formData.get("suggestedMinutes") as string, 10) || 30;
  const forDateStr = formData.get("forDate") as string | null;

  if (!tagId || !tagName) return { ok: false };

  let scheduledAt: Date;
  if (forDateStr && /^\d{4}-\d{2}-\d{2}$/.test(forDateStr)) {
    scheduledAt = new Date(`${forDateStr}T12:00:00.000Z`);
  } else {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    scheduledAt = today;
  }

  await createTask(session.user.id, {
    title: tagName,
    durationMinutes: suggestedMinutes,
    scheduledAt,
    tagIds: [tagId],
  });
  revalidatePath("/");
  revalidatePath("/plan");
  revalidatePath("/tasks");
  revalidatePath("/progress");
  return { ok: true };
}

/**
 * Fetch tasks scheduled for the given date (YYYY-MM-DD).
 * If tzOffsetMinutes is provided (getTimezoneOffset from client), the date is interpreted as the user's local day.
 * Otherwise it is interpreted as UTC day (fallback).
 */
export async function getPlanTodayTasksAction(
  dateStr: string,
  tzOffsetMinutes?: string | null
): Promise<PlanTodayTask[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return [];

  const tzNum = tzOffsetMinutes != null ? parseInt(tzOffsetMinutes, 10) : NaN;
  const useTz = !Number.isNaN(tzNum) && Math.abs(tzNum) <= 60 * 14;

  let start: Date;
  let end: Date;
  if (useTz) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const startUtcMs =
      Date.UTC(y, m - 1, d, 0, 0, 0, 0) + tzNum * 60 * 1000;
    const endUtcMs =
      Date.UTC(y, m - 1, d, 23, 59, 59, 999) + tzNum * 60 * 1000;
    start = new Date(startUtcMs);
    end = new Date(endUtcMs);
  } else {
    start = new Date(`${dateStr}T00:00:00.000Z`);
    end = new Date(`${dateStr}T23:59:59.999Z`);
  }
  return getTasks(session.user.id, { from: start, to: end });
}

export async function completeTaskFormAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const taskId = formData.get("taskId") as string;
  if (taskId) {
    await completeTask(session.user.id, taskId);
    await checkAndUnlockAchievements(session.user.id).catch(() => {});
    revalidatePath("/");
    revalidatePath("/plan");
    revalidatePath("/tasks");
    revalidatePath("/progress");
    redirect("/plan?success=done");
  }
}

export async function uncompleteTaskFormAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const taskId = formData.get("taskId") as string;
  if (taskId) {
    await uncompleteTask(session.user.id, taskId);
    revalidatePath("/");
    revalidatePath("/plan");
    revalidatePath("/tasks");
    revalidatePath("/progress");
    redirect("/plan?success=undone");
  }
}

export async function deleteTaskFormAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const taskId = formData.get("taskId") as string;
  if (taskId) {
    await deleteTask(session.user.id, taskId);
    revalidatePath("/");
    revalidatePath("/plan");
    revalidatePath("/tasks");
    revalidatePath("/progress");
    redirect("/plan?success=deleted");
  }
}
