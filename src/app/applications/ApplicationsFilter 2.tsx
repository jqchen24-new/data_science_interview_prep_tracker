"use client";

import {
  APPLICATION_STATUSES,
  type ApplicationSort,
} from "@/lib/application-constants";

export function ApplicationsFilter({
  currentStatus,
  currentSort,
}: {
  currentStatus: string;
  currentSort: ApplicationSort;
}) {
  return (
    <form method="get" action="/applications" className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <label htmlFor="filter-status" className="text-sm text-neutral-600 dark:text-neutral-400">
          Filter:
        </label>
        <select
          id="filter-status"
          name="status"
          defaultValue={currentStatus}
          onChange={(e) => e.currentTarget.form?.submit()}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
        >
          <option value="">All</option>
          {APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="filter-sort" className="text-sm text-neutral-600 dark:text-neutral-400">
          Sort:
        </label>
        <select
          id="filter-sort"
          name="sort"
          defaultValue={currentSort}
          onChange={(e) => e.currentTarget.form?.submit()}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
        >
          <option value="applied">Date applied</option>
          <option value="statusUpdated">Status updated</option>
        </select>
      </div>
    </form>
  );
}
