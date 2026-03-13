import { NextResponse } from "next/server";
import { getTasks } from "@/lib/tasks";
import { getSuggestedPlanForDate } from "@/lib/tasks";
import { requireAuth } from "../../require-auth";

export async function GET(request: Request) {
  const [err, user] = await requireAuth(request);
  if (err) return err;

  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const tzOffset = searchParams.get("tzOffset") ?? null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ error: "Invalid date format (use YYYY-MM-DD)" }, { status: 400 });
  }

  const tzNum = tzOffset != null ? parseInt(tzOffset, 10) : NaN;
  const useTz = !Number.isNaN(tzNum) && Math.abs(tzNum) <= 60 * 14;

  let start: Date;
  let end: Date;
  if (useTz) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const startUtcMs = Date.UTC(y, m - 1, d, 0, 0, 0, 0) + tzNum * 60 * 1000;
    const endUtcMs = Date.UTC(y, m - 1, d, 23, 59, 59, 999) + tzNum * 60 * 1000;
    start = new Date(startUtcMs);
    end = new Date(endUtcMs);
  } else {
    start = new Date(`${dateStr}T00:00:00.000Z`);
    end = new Date(`${dateStr}T23:59:59.999Z`);
  }

  const [tasks, suggested] = await Promise.all([
    getTasks(user!.id, { from: start, to: end }),
    getSuggestedPlanForDate(user!.id, start),
  ]);

  return NextResponse.json({
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      durationMinutes: t.durationMinutes,
      scheduledAt: t.scheduledAt.toISOString(),
      completedAt: t.completedAt?.toISOString() ?? null,
      tags: t.tags.map((tt) => ({ id: tt.tag.id, name: tt.tag.name, slug: tt.tag.slug })),
    })),
    suggested: suggested.map((s) => ({
      tagId: s.tagId,
      tagName: s.tagName,
      tagSlug: s.tagSlug,
      suggestedMinutes: s.suggestedMinutes,
    })),
  });
}
