"use client";

import { useActionState } from "react";
import Link from "next/link";
import { APPLICATION_STATUSES } from "@/lib/applications";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateApplicationAction } from "./actions";

type App = {
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

export function ApplicationEditForm({ app }: { app: App }) {
  const appliedAtStr = new Date(app.appliedAt.getTime() - app.appliedAt.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

  const [state, formAction] = useActionState<{ error: string | null }, FormData>(
    async (_, formData) => updateApplicationAction(formData),
    { error: null }
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={app.id} />
      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Company" name="company" required defaultValue={app.company} />
        <Input label="Role" name="role" required defaultValue={app.role} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Status
          </label>
          <select
            id="status"
            name="status"
            required
            defaultValue={app.status}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
          >
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {app.statusUpdatedAt && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Status last updated {new Date(app.statusUpdatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <Input
          label="Date applied"
          name="appliedAt"
          type="date"
          required
          defaultValue={appliedAtStr}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Job URL" name="jobUrl" type="url" defaultValue={app.jobUrl ?? ""} />
        <Input
          label="Next step / deadline"
          name="nextStepOrDeadline"
          defaultValue={app.nextStepOrDeadline ?? ""}
        />
      </div>
      <div>
        <label htmlFor="notes" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={app.notes ?? ""}
          className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit">Save changes</Button>
        <Link href="/applications">
          <Button type="button" variant="ghost">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
