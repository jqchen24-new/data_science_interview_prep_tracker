import { NextResponse } from "next/server";
import {
  getApplicationById,
  updateApplication,
  deleteApplication,
  isValidStatus,
} from "@/lib/applications";
import { requireAuth } from "../../require-auth";

type Params = Promise<{ id: string }>;

function serialize(app: Awaited<ReturnType<typeof getApplicationById>>) {
  if (!app) return null;
  return {
    id: app.id,
    company: app.company,
    role: app.role,
    status: app.status,
    appliedAt: app.appliedAt.toISOString(),
    statusUpdatedAt: app.statusUpdatedAt?.toISOString() ?? null,
    notes: app.notes,
    jobUrl: app.jobUrl,
    nextStepOrDeadline: app.nextStepOrDeadline,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  };
}

export async function GET(
  request: Request,
  { params }: { params: Params }
) {
  const [err, user] = await requireAuth(request);
  if (err) return err;
  const { id } = await params;
  const app = await getApplicationById(user!.id, id);
  if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  return NextResponse.json(serialize(app));
}

export async function PATCH(
  request: Request,
  { params }: { params: Params }
) {
  const [err, user] = await requireAuth(request);
  if (err) return err;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const data: Parameters<typeof updateApplication>[2] = {};
  if (typeof body.company === "string") data.company = body.company.trim();
  if (typeof body.role === "string") data.role = body.role.trim();
  if (typeof body.status === "string" && isValidStatus(body.status)) data.status = body.status;
  if (typeof body.appliedAt === "string") {
    const d = new Date(body.appliedAt);
    if (!Number.isNaN(d.getTime())) data.appliedAt = d;
  }
  if (body.notes !== undefined) data.notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
  if (body.jobUrl !== undefined) data.jobUrl = typeof body.jobUrl === "string" ? body.jobUrl.trim() || null : null;
  if (body.nextStepOrDeadline !== undefined) {
    data.nextStepOrDeadline =
      typeof body.nextStepOrDeadline === "string" ? body.nextStepOrDeadline.trim() || null : null;
  }

  if (Object.keys(data).length === 0) {
    const app = await getApplicationById(user!.id, id);
    if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });
    return NextResponse.json(serialize(app));
  }

  try {
    const app = await updateApplication(user!.id, id, data);
    return NextResponse.json(serialize(app));
  } catch {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
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
    await deleteApplication(user!.id, id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }
}
