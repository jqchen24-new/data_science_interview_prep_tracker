import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getApplications, APPLICATION_STATUSES } from "@/lib/applications";
import { Card, CardTitle } from "@/components/ui/Card";
import { SuccessBanner } from "@/components/ui/SuccessBanner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createApplicationAction } from "./actions";
import { ApplicationsList } from "./ApplicationsList";
import { ApplicationsFilter } from "./ApplicationsFilter";

export const dynamic = "force-dynamic";
export const metadata = { title: "Applications" };

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[]; sort?: string | string[]; error?: string | string[] }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const params = await searchParams;
  const rawError = params.error;
  const errorMsg =
    typeof rawError === "string" ? rawError : Array.isArray(rawError) ? rawError[0] ?? "" : "";
  const rawStatus = params.status;
  const statusFilter =
    typeof rawStatus === "string" ? rawStatus.trim() : Array.isArray(rawStatus) ? rawStatus[0]?.trim() ?? "" : "";
  const rawSort = params.sort;
  const sortParam =
    typeof rawSort === "string" ? rawSort.trim() : Array.isArray(rawSort) ? rawSort[0]?.trim() ?? "" : "";
  const sort: "applied" | "statusUpdated" =
    sortParam === "statusUpdated" ? "statusUpdated" : "applied";
  const applications = await getApplications(userId, {
    ...(statusFilter && { status: statusFilter }),
    sort,
  });

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

      {errorMsg && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
        >
          {decodeURIComponent(errorMsg)}
        </div>
      )}

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
          <div className="flex flex-wrap items-center gap-3">
            <ApplicationsFilter
            key={`${statusFilter || "all"}-${sort}`}
            currentStatus={statusFilter || ""}
            currentSort={sort}
          />
            <Link
              href="/api/applications/export"
              download
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              Export CSV
            </Link>
          </div>
        </div>
        <ApplicationsList applications={applications} filterStatus={statusFilter || undefined} />
      </Card>
    </div>
  );
}
