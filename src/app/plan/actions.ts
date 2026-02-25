"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createTask, completeTask, uncompleteTask, deleteTask } from "@/lib/tasks";

export async function addSuggestedToTodayAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const tagId = formData.get("tagId") as string;
  const tagName = formData.get("tagName") as string;
  const suggestedMinutes = parseInt(formData.get("suggestedMinutes") as string, 10) || 30;

  if (!tagId || !tagName) return;

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  await createTask(session.user.id, {
    title: tagName,
    durationMinutes: suggestedMinutes,
    scheduledAt: today,
    tagIds: [tagId],
  });
  revalidatePath("/");
  revalidatePath("/plan");
  revalidatePath("/tasks");
  revalidatePath("/progress");
  redirect("/plan?success=added");
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
