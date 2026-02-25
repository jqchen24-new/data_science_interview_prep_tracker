/** Shared constants and types for applications. Safe to import from client components (no server/db deps). */

export const APPLICATION_STATUSES = [
  "Applied",
  "Phone Screen",
  "On-site",
  "Offer",
  "Rejected",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type ApplicationSort = "applied" | "statusUpdated";

export function isValidStatus(s: string): s is ApplicationStatus {
  return APPLICATION_STATUSES.includes(s as ApplicationStatus);
}
