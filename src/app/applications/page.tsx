import { Suspense } from "react";
import Link from "next/link";
import { getApplications } from "@/lib/applications";
import { APPLICATION_STATUSES } from "@/lib/applications";
import { Card, CardTitle } from "@/components/ui/Card";
import { SuccessBanner } from "@/components/ui/SuccessBanner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createApplicationAction } from "./actions";
import { ApplicationsList } from "./ApplicationsList";
import { ApplicationsFilter } from "./ApplicationsFilter";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusFilter } = await searchParams;
  const applications = await getApplications(
    statusFilter ? { status: statusFilter } : undefined
  );

  const appliedAtDefault = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Applications
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Track job and interview applications.
        </p>
      </div>

      <Suspense fallback={null}>
        <SuccessBanner />
      </Suspense>

      <Card>
        <CardTitle>Add application</CardTitle>
        <form action={createApplicationAction} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Company" name="company" required placeholder="Acme Inc." />
            <Input label="Role" name="role" required placeholder="Data Scientist" />
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
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
              >
                {APPLICATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Date applied"
              name="appliedAt"
              type="date"
              required
              defaultValue={appliedAtDefault}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Job URL"
              name="jobUrl"
              type="url"
              placeholder="https://..."
            />
            <Input
              label="Next step / deadline"
              name="nextStepOrDeadline"
              placeholder="e.g. Follow up Friday"
            />
          </div>
          <div>
            <label htmlFor="notes" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 placeholder-neutral-500 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-400"
              placeholder="Optional notes"
            />
          </div>
          <Button type="submit">Add application</Button>
        </form>
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <CardTitle className="mb-0">Applications</CardTitle>
          <ApplicationsFilter currentStatus={statusFilter ?? ""} />
        </div>
        <ApplicationsList applications={applications} />
      </Card>
    </div>
  );
}
