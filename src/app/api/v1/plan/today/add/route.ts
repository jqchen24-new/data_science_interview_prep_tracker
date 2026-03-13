import { NextResponse } from "next/server";
import { createTask } from "@/lib/tasks";
import { requireAuth } from "../../../require-auth";

export async function POST(request: Request) {
  const [err, user] = await requireAuth(request);
  if (err) return err;

  const body = await request.json().catch(() => ({}));
  const tagId = typeof body.tagId === "string" ? body.tagId.trim() : "";
  const tagName = typeof body.tagName === "string" ? body.tagName.trim() : "";
  const suggestedMinutes =
    typeof body.suggestedMinutes === "number"
      ? body.suggestedMinutes
      : parseInt(String(body.suggestedMinutes), 10) || 30;
  const forDateStr = typeof body.forDate === "string" ? body.forDate : null;

  if (!tagId || !tagName) {
    return NextResponse.json(
      { error: "tagId and tagName are required" },
      { status: 400 }
    );
  }

  let scheduledAt: Date;
  if (forDateStr && /^\d{4}-\d{2}-\d{2}$/.test(forDateStr)) {
    scheduledAt = new Date(`${forDateStr}T12:00:00.000Z`);
  } else {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    scheduledAt = today;
  }

  try {
    const task = await createTask(user!.id, {
      title: tagName,
      durationMinutes: suggestedMinutes,
      scheduledAt,
      tagIds: [tagId],
    });
    return NextResponse.json({
      id: task.id,
      title: task.title,
      durationMinutes: task.durationMinutes,
      scheduledAt: task.scheduledAt.toISOString(),
      completedAt: task.completedAt?.toISOString() ?? null,
      tags: task.tags.map((tt) => ({ id: tt.tag.id, name: tt.tag.name, slug: tt.tag.slug })),
    });
  } catch (e) {
    console.error("[API v1 plan/today/add]", e);
    return NextResponse.json({ error: "Failed to add task" }, { status: 500 });
  }
}
