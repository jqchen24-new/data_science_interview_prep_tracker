"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createApplication,
  updateApplication,
  deleteApplication,
  getApplicationById,
  APPLICATION_STATUSES,
  isValidStatus,
} from "@/lib/applications";

export async function createApplicationAction(formData: FormData) {
  const company = (formData.get("company") as string)?.trim();
  const role = (formData.get("role") as string)?.trim();
  const status = formData.get("status") as string;
  const appliedAtStr = formData.get("appliedAt") as string;
  const notes = (formData.get("notes") as string)?.trim() || null;
  const jobUrl = (formData.get("jobUrl") as string)?.trim() || null;
  const nextStepOrDeadline = (formData.get("nextStepOrDeadline") as string)?.trim() || null;

  if (!company) return { error: "Company is required" };
  if (!role) return { error: "Role is required" };
  if (!appliedAtStr) return { error: "Date applied is required" };
  const appliedAt = new Date(appliedAtStr);
  if (Number.isNaN(appliedAt.getTime())) return { error: "Invalid date" };
  if (!status || !APPLICATION_STATUSES.includes(status as (typeof APPLICATION_STATUSES)[number])) {
    return { error: "Invalid status" };
  }

  await createApplication({
    company,
    role,
    status,
    appliedAt,
    notes,
    jobUrl,
    nextStepOrDeadline,
  });
  revalidatePath("/applications");
  redirect("/applications?success=app_created");
}

export async function updateApplicationAction(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return { error: "Missing application id" };
  const company = (formData.get("company") as string)?.trim();
  const role = (formData.get("role") as string)?.trim();
  const status = formData.get("status") as string;
  const appliedAtStr = formData.get("appliedAt") as string;
  const notes = (formData.get("notes") as string)?.trim() || null;
  const jobUrl = (formData.get("jobUrl") as string)?.trim() || null;
  const nextStepOrDeadline = (formData.get("nextStepOrDeadline") as string)?.trim() || null;

  if (!company) return { error: "Company is required" };
  if (!role) return { error: "Role is required" };
  if (!appliedAtStr) return { error: "Date applied is required" };
  const appliedAt = new Date(appliedAtStr);
  if (Number.isNaN(appliedAt.getTime())) return { error: "Invalid date" };
  if (!status || !isValidStatus(status)) return { error: "Invalid status" };

  const existing = await getApplicationById(id);
  const statusChanged = existing && existing.status !== status;

  await updateApplication(id, {
    company,
    role,
    status,
    appliedAt,
    ...(statusChanged && { statusUpdatedAt: new Date() }),
    notes,
    jobUrl,
    nextStepOrDeadline,
  });
  revalidatePath("/applications");
  redirect("/applications?success=app_updated");
}

export async function deleteApplicationAction(formData: FormData) {
  const id = formData.get("id") as string;
  if (id) {
    await deleteApplication(id);
    revalidatePath("/applications");
    redirect("/applications?success=app_deleted");
  }
}
