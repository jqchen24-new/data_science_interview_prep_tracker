import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getAllTags } from "@/lib/tags";
import { getTasks } from "@/lib/tasks";
import { TaskForm } from "@/components/tasks/TaskForm";
import { SuccessBanner } from "@/components/ui/SuccessBanner";
import { LoadingFallback } from "@/components/ui/LoadingFallback";
import {
  completeTaskAction,
  uncompleteTaskAction,
  deleteTaskAction,
} from "@/app/tasks/actions";
import { TasksPageClient } from "./TasksPageClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tasks" };

export default async function TasksPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const [tags, allTasks] = await Promise.all([getAllTags(userId), getTasks(userId)]);
  const now = new Date();
  const upcoming = allTasks.filter(
    (t) => !t.completedAt && new Date(t.scheduledAt) >= now
  );
  const past = allTasks
    .filter((t) => t.completedAt || new Date(t.scheduledAt) < now)
    .sort(
      (a, b) =>
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Tasks
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Study sessions with date, time, and tags.
        </p>
      </div>

      <Suspense fallback={<LoadingFallback />}>
        <SuccessBanner />
      </Suspense>

      <TaskForm tagOptions={tags} />

      <TasksPageClient
        upcoming={upcoming}
        past={past}
        tags={tags}
        onComplete={completeTaskAction}
        onUncomplete={uncompleteTaskAction}
        onDelete={deleteTaskAction}
      />
    </div>
  );
}
