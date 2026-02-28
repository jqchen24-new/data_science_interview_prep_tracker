import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getSuggestedPlanForDate } from "@/lib/tasks";
import type { SuggestedItem } from "@/lib/tasks";
import { Card, CardTitle } from "@/components/ui/Card";
import { SuggestedPlan } from "@/components/plan/SuggestedPlan";
import { PlanTodayList } from "@/components/plan/PlanTodayList";
import { SuccessBanner } from "@/components/ui/SuccessBanner";
import { LoadingFallback } from "@/components/ui/LoadingFallback";

export const dynamic = "force-dynamic";
export const metadata = { title: "Daily Plan" };

async function loadPlanData(userId: string) {
  const today = new Date();
  try {
    const suggested = await getSuggestedPlanForDate(userId, today);
    return { suggested, error: null as string | null };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Plan data error:", e);
    return {
      suggested: [] as SuggestedItem[],
      error: message,
    };
  }
}

export default async function PlanPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const { suggested, error } = await loadPlanData(userId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Daily Plan
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Today’s sessions and suggested practice based on your progress.
        </p>
      </div>

      <Suspense fallback={<LoadingFallback />}>
        <SuccessBanner />
      </Suspense>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="font-medium text-amber-800 dark:text-amber-200">
            Could not load some data
          </p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            {error}
          </p>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Check that the database exists and run:{" "}
            <code className="rounded bg-neutral-200 px-1 dark:bg-neutral-700">
              npx prisma migrate dev
            </code>{" "}
            and{" "}
            <code className="rounded bg-neutral-200 px-1 dark:bg-neutral-700">
              npx prisma db seed
            </code>
          </p>
        </div>
      )}

      <Card>
        <CardTitle>Suggested for today</CardTitle>
        <p className="mb-2 text-sm text-neutral-500 dark:text-neutral-400">
          Based on tags you haven’t practiced recently, then by least total time.
        </p>
        <SuggestedPlan items={suggested ?? []} />
      </Card>

      <Card>
        <CardTitle>Today’s plan</CardTitle>
        <PlanTodayList />
      </Card>
    </div>
  );
}
