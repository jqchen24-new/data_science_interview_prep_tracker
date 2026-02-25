"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  createTask,
  updateTask,
  completeTask,
  uncompleteTask,
  deleteTask,
} from "@/lib/tasks";
import type { Prisma } from "@prisma/client";

export type Task = Prisma.TaskGetPayload<{
  include: { tags: { include: { tag: true } } };
}>;

export async function createTaskAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const title = formData.get("title") as string;
  const scheduledAt = formData.get("scheduledAt") as string;
  const durationMinutes = formData.get("durationMinutes")
    ? parseInt(formData.get("durationMinutes") as string, 10)
    : undefined;
  const tagIds = formData.getAll("tagIds") as string[];

  if (!title?.trim()) return { error: "Title is required" };
  if (!scheduledAt) return { error: "Date and time are required" };
  const date = new Date(scheduledAt);
  if (isNaN(date.getTime())) return { error: "Invalid date/time" };

  await createTask(session.user.id, {
    title: title.trim(),
    durationMinutes: durationMinutes ?? null,
    scheduledAt: date,
    tagIds: tagIds.filter(Boolean),
  });
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/plan");
  revalidatePath("/progress");
  redirect("/tasks?success=created");
}

export async function updateTaskAction(
  id: string,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const title = formData.get("title") as string;
  const scheduledAt = formData.get("scheduledAt") as string;
  const durationMinutes = formData.get("durationMinutes")
    ? parseInt(formData.get("durationMinutes") as string, 10)
    : undefined;
  const tagIds = formData.getAll("tagIds") as string[];

  if (!title?.trim()) return { error: "Title is required" };
  if (!scheduledAt) return { error: "Date and time are required" };
  const date = new Date(scheduledAt);
  if (isNaN(date.getTime())) return { error: "Invalid date/time" };

  await updateTask(session.user.id, id, {
    title: title.trim(),
    durationMinutes: durationMinutes ?? null,
    scheduledAt: date,
    tagIds: tagIds.filter(Boolean),
  });
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/plan");
  revalidatePath("/progress");
  redirect("/tasks?success=updated");
}

export async function completeTaskAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  await completeTask(session.user.id, id);
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/plan");
  revalidatePath("/progress");
  redirect("/tasks?success=done");
}

export async function uncompleteTaskAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  await uncompleteTask(session.user.id, id);
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/plan");
  revalidatePath("/progress");
  redirect("/tasks?success=undone");
}

export async function deleteTaskAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  await deleteTask(session.user.id, id);
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/plan");
  revalidatePath("/progress");
  redirect("/tasks?success=deleted");
}
