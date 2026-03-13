import { NextResponse } from "next/server";
import { getTasks } from "@/lib/tasks";
import { createTask } from "@/lib/tasks";
import { requireAuth } from "../require-auth";

export async function GET(request: Request) {
  const [err, user] = await requireAuth(request);
  if (err) return err;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const tagId = searchParams.get("tagId") ?? undefined;
  const completed = searchParams.get("completed");
  const filters: { from?: Date; to?: Date; tagId?: string; completed?: boolean } = {};
  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) filters.from = d;
  }
  if (to) {
    const d = new Date(to);
    if (!Number.isNaN(d.getTime())) filters.to = d;
  }
  if (tagId) filters.tagId = tagId;
  if (completed === "true") filters.completed = true;
  if (completed === "false") filters.completed = false;

  const tasks = await getTasks(user!.id, Object.keys(filters).length ? filters : undefined);
  return NextResponse.json(
    tasks.map((t) => ({
      id: t.id,
      title: t.title,
      durationMinutes: t.durationMinutes,
      scheduledAt: t.scheduledAt.toISOString(),
      completedAt: t.completedAt?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      tags: t.tags.map((tt) => ({ id: tt.tag.id, name: tt.tag.name, slug: tt.tag.slug })),
    }))
  );
}

export async function POST(request: Request) {
  const [err, user] = await requireAuth(request);
  if (err) return err;

  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const scheduledAtStr = typeof body.scheduledAt === "string" ? body.scheduledAt : "";
  const durationMinutes =
    body.durationMinutes != null ? parseInt(String(body.durationMinutes), 10) : undefined;
  const tagIds = Array.isArray(body.tagIds)
    ? (body.tagIds as unknown[]).filter((x): x is string => typeof x === "string")
    : [];

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  const scheduledAt = new Date(scheduledAtStr);
  if (Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json({ error: "Valid scheduledAt is required" }, { status: 400 });
  }

  try {
    const task = await createTask(user!.id, {
      title,
      scheduledAt,
      durationMinutes: Number.isNaN(durationMinutes) ? null : durationMinutes ?? null,
      tagIds,
    });
    return NextResponse.json({
      id: task.id,
      title: task.title,
      durationMinutes: task.durationMinutes,
      scheduledAt: task.scheduledAt.toISOString(),
      completedAt: task.completedAt?.toISOString() ?? null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      tags: task.tags.map((tt) => ({ id: tt.tag.id, name: tt.tag.name, slug: tt.tag.slug })),
    });
  } catch (e) {
    console.error("[API v1 tasks POST]", e);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
