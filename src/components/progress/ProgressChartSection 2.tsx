"use client";

import nextDynamic from "next/dynamic";
import type { TimeByTagChartProps } from "./TimeByTagChart";

const TimeByTagChart = nextDynamic(
  () => import("./TimeByTagChart").then((m) => ({ default: m.TimeByTagChart })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 min-h-[200px] items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
        Loading chart…
      </div>
    ),
  }
);

export function ProgressChartSection(props: TimeByTagChartProps) {
  return <TimeByTagChart {...props} />;
}
