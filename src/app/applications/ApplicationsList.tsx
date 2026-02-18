import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { deleteApplicationAction } from "./actions";

type Application = {
  id: string;
  company: string;
  role: string;
  status: string;
  appliedAt: Date;
  notes: string | null;
  jobUrl: string | null;
  nextStepOrDeadline: string | null;
};

export function ApplicationsList({ applications }: { applications: Application[] }) {
  if (applications.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 py-8 text-center text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
        No applications yet. Add one above.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {applications.map((app) => {
        const appliedAt = new Date(app.appliedAt);
        const dateStr = appliedAt.toLocaleDateString();
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
              <form action={deleteApplicationAction} className="inline">
                <input type="hidden" name="id" value={app.id} />
                <Button type="submit" variant="ghost">
                  Delete
                </Button>
              </form>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
