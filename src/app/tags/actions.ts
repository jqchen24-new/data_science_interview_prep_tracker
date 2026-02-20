"use server";

import { revalidatePath } from "next/cache";
import { createTag, updateTag, deleteTag } from "@/lib/tags";

export async function createTagAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Name is required" };
  try {
    await createTag(name);
    revalidatePath("/tags");
    revalidatePath("/tasks");
    revalidatePath("/plan");
    return { error: null };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to create tag",
    };
  }
}

export async function updateTagAction(formData: FormData) {
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  if (!id) return { error: "Tag is required" };
  if (!name) return { error: "Name is required" };
  try {
    await updateTag(id, name);
    revalidatePath("/tags");
    revalidatePath("/tasks");
    revalidatePath("/plan");
    return { error: null };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to update tag",
    };
  }
}

export async function deleteTagAction(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;
  try {
    await deleteTag(id);
    revalidatePath("/tags");
    revalidatePath("/tasks");
    revalidatePath("/plan");
  } catch (e) {
    console.error(e);
  }
}
