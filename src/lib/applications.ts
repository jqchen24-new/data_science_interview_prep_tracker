import { prisma } from "./db";
import {
  APPLICATION_STATUSES,
  type ApplicationSort,
  isValidStatus,
} from "./application-constants";

export { APPLICATION_STATUSES, isValidStatus };
export type { ApplicationSort, ApplicationStatus } from "./application-constants";

export async function getApplications(
  userId: string,
  filters?: {
    status?: string;
    sort?: ApplicationSort;
  }
) {
  const status = filters?.status?.trim();
  const validStatus = status && isValidStatus(status) ? status : undefined;
  const where = validStatus ? { userId, status: validStatus } : { userId };
  const sort = filters?.sort === "statusUpdated" ? "statusUpdated" : "applied";
  const orderBy =
    sort === "statusUpdated"
      ? [{ statusUpdatedAt: "desc" as const }, { appliedAt: "desc" as const }]
      : { appliedAt: "desc" as const };
  return prisma.application.findMany({
    where,
    orderBy,
  });
}

export async function getApplicationById(userId: string, id: string) {
  return prisma.application.findFirst({
    where: { id, userId },
  });
}

export async function createApplication(
  userId: string,
  data: {
    company: string;
    role: string;
    status: string;
    appliedAt: Date;
    notes?: string | null;
    jobUrl?: string | null;
    nextStepOrDeadline?: string | null;
  }
) {
  return prisma.application.create({
    data: {
      userId,
      company: data.company.trim(),
      role: data.role.trim(),
      status: data.status,
      appliedAt: data.appliedAt,
      statusUpdatedAt: data.appliedAt, // initial status set at apply time
      notes: data.notes?.trim() || null,
      jobUrl: data.jobUrl?.trim() || null,
      nextStepOrDeadline: data.nextStepOrDeadline?.trim() || null,
    },
  });
}

export async function updateApplication(
  userId: string,
  id: string,
  data: {
    company?: string;
    role?: string;
    status?: string;
    appliedAt?: Date;
    statusUpdatedAt?: Date | null;
    notes?: string | null;
    jobUrl?: string | null;
    nextStepOrDeadline?: string | null;
  }
) {
  const clean: Record<string, unknown> = {};
  if (data.company !== undefined) clean.company = data.company.trim();
  if (data.role !== undefined) clean.role = data.role.trim();
  if (data.status !== undefined) clean.status = data.status;
  if (data.appliedAt !== undefined) clean.appliedAt = data.appliedAt;
  if (data.statusUpdatedAt !== undefined) clean.statusUpdatedAt = data.statusUpdatedAt;
  if (data.notes !== undefined) clean.notes = data.notes?.trim() || null;
  if (data.jobUrl !== undefined) clean.jobUrl = data.jobUrl?.trim() || null;
  if (data.nextStepOrDeadline !== undefined)
    clean.nextStepOrDeadline = data.nextStepOrDeadline?.trim() || null;
  return prisma.application.update({
    where: { id, userId },
    data: clean,
  });
}

export async function deleteApplication(userId: string, id: string) {
  return prisma.application.delete({ where: { id, userId } });
}
