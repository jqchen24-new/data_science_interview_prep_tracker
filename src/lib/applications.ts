import { prisma } from "./db";

export const APPLICATION_STATUSES = [
  "Applied",
  "Phone Screen",
  "On-site",
  "Offer",
  "Rejected",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export function isValidStatus(s: string): s is ApplicationStatus {
  return APPLICATION_STATUSES.includes(s as ApplicationStatus);
}

export async function getApplications(filters?: { status?: string }) {
  const status = filters?.status?.trim();
  const validStatus = status && isValidStatus(status) ? status : undefined;
  const where = validStatus ? { status: validStatus } : {};
  return prisma.application.findMany({
    where,
    orderBy: { appliedAt: "desc" },
  });
}

export async function getApplicationById(id: string) {
  return prisma.application.findUnique({
    where: { id },
  });
}

export async function createApplication(data: {
  company: string;
  role: string;
  status: string;
  appliedAt: Date;
  notes?: string | null;
  jobUrl?: string | null;
  nextStepOrDeadline?: string | null;
}) {
  return prisma.application.create({
    data: {
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
    where: { id },
    data: clean,
  });
}

export async function deleteApplication(id: string) {
  return prisma.application.delete({ where: { id } });
}
