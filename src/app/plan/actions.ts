"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createTask, completeTask, uncompleteTask, deleteTask, getTasks } from "@/lib/tasks";

export type PlanTodayTask = Awaited<ReturnType<typeof getTasks>>[number];

export async function addSuggestedToTodayAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const tagId = formData.get("tagId") as string;
  const tagName = formData.get("tagName") as string;
  const suggestedMinutes = parseInt(formData.get("suggestedMinutes") as string, 10) || 30;
  const forDateStr = formData.get("forDate") as string | null;

  if (!tagId || !tagName) return;

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
  redirect("/plan?success=added");
}

/** Fetch tasks scheduled for the given date (YYYY-MM-DD, interpreted as UTC day). */
export async function getPlanTodayTasksAction(dateStr: string): Promise<PlanTodayTask[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return [];
  const start = new Date(`${dateStr}T00:00:00.000Z`);
  const end = new Date(`${dateStr}T23:59:59.999Z`);
  return getTasks(session.user.id, { from: start, to: end });
}

export async function completeTaskFormAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const taskId = formData.get("taskId") as string;
  if (taskId) {
    await completeTask(session.user.id, taskId);
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
