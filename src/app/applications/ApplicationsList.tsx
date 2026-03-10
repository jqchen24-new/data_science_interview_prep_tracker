import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ApplicationDeleteButton } from "./ApplicationDeleteButton";

type Application = {
  id: string;
  company: string;
  role: string;
  status: string;
  appliedAt: Date;
  statusUpdatedAt: Date | null;
  notes: string | null;
  jobUrl: string | null;
  nextStepOrDeadline: string | null;
};

export function ApplicationsList({
  applications,
  filterStatus,
}: {
  applications: Application[];
  filterStatus?: string;
}) {
  if (applications.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 py-8 dark:border-neutral-700">
        <p className="text-center text-neutral-500 dark:text-neutral-400">
        {filterStatus
          ? `No applications with status “${filterStatus}”. Try “All” or another filter.`
          : "No applications yet."}
        </p>
        {!filterStatus && (
          <p className="mt-3 text-center">
            <a
              href="#add-application-form"
              className="inline-flex rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Add your first application
            </a>
          </p>
        )}
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {applications.map((app) => {
        const appliedAt = new Date(app.appliedAt);
        const dateStr = appliedAt.toLocaleDateString();
        const statusUpdatedStr = app.statusUpdatedAt
          ? new Date(app.statusUpdatedAt).toLocaleDateString()
          : null;
        return (
          <li
            key={app.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/50"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-neutral-900 dark:text-white">
                {app.company} – {app.role}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Applied {dateStr}
                {statusUpdatedStr && statusUpdatedStr !== dateStr && ` · Status updated ${statusUpdatedStr}`}
                {app.nextStepOrDeadline && ` · ${app.nextStepOrDeadline}`}
              </p>
              <div className="mt-1">
                <Badge>{app.status}</Badge>
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <Link href={`/applications/${app.id}`}>
                <Button type="button" variant="ghost">
                  Edit
                </Button>
              </Link>
              <ApplicationDeleteButton
                id={app.id}
                label={`${app.company} – ${app.role}`}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
