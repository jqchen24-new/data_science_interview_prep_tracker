import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getTaskById } from "@/lib/tasks";
import { getAllTags } from "@/lib/tags";
import { EditTaskForm } from "@/components/tasks/EditTaskForm";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit Task" };

export default async function TaskEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const { id } = await params;
  const [task, tags] = await Promise.all([getTaskById(userId, id), getAllTags(userId)]);
  if (!task) notFound();

  const scheduled = new Date(task.scheduledAt);
  const scheduledStr = new Date(scheduled.getTime() - scheduled.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Edit task
        </h1>
        <Link href="/tasks">
          <Button variant="ghost">Back to tasks</Button>
        </Link>
      </div>
      <EditTaskForm
        taskId={task.id}
        tagOptions={tags}
        initialTitle={task.title}
        initialDuration={task.durationMinutes?.toString() ?? ""}
        initialScheduled={scheduledStr}
        initialTagIds={task.tags.map((tt) => tt.tagId)}
      />
    </div>
  );
}
