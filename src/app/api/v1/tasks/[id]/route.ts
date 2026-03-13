import { NextResponse } from "next/server";
import {
  getTaskById,
  completeTask,
  uncompleteTask,
  deleteTask,
  updateTask,
} from "@/lib/tasks";
import { requireAuth } from "../../require-auth";

type Params = Promise<{ id: string }>;

export async function GET(
  request: Request,
  { params }: { params: Params }
) {
  const [err, user] = await requireAuth(request);
  if (err) return err;
  const { id } = await params;
  const task = await getTaskById(user!.id, id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
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
}

export async function PATCH(
  request: Request,
  { params }: { params: Params }
) {
  const [err, user] = await requireAuth(request);
  if (err) return err;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  if (body.completedAt !== undefined) {
    const task = body.completedAt === true || body.completedAt === "true"
      ? await completeTask(user!.id, id)
      : await uncompleteTask(user!.id, id);
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
  }

  const title = typeof body.title === "string" ? body.title.trim() : undefined;
  const scheduledAtStr = typeof body.scheduledAt === "string" ? body.scheduledAt : undefined;
  const durationMinutes =
    body.durationMinutes != null ? parseInt(String(body.durationMinutes), 10) : undefined;
  const tagIds = Array.isArray(body.tagIds)
    ? (body.tagIds as unknown[]).filter((x): x is string => typeof x === "string")
    : undefined;

  const data: Parameters<typeof updateTask>[2] = {};
  if (title !== undefined) data.title = title;
  if (scheduledAtStr !== undefined) {
    const d = new Date(scheduledAtStr);
    if (!Number.isNaN(d.getTime())) data.scheduledAt = d;
  }
  if (durationMinutes !== undefined) data.durationMinutes = Number.isNaN(durationMinutes) ? null : durationMinutes;
  if (tagIds !== undefined) data.tagIds = tagIds;

  if (Object.keys(data).length === 0) {
    const task = await getTaskById(user!.id, id);
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
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
  }

  try {
    const task = await updateTask(user!.id, id, data);
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
  } catch {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Params }
) {
  const [err, user] = await requireAuth(_request);
  if (err) return err;
  const { id } = await params;
  try {
    await deleteTask(user!.id, id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
}
