import { NextResponse } from "next/server";
import {
  getApplications,
  createApplication,
  APPLICATION_STATUSES,
  isValidStatus,
} from "@/lib/applications";
import type { ApplicationSort } from "@/lib/applications";
import { requireAuth } from "../require-auth";

export async function GET(request: Request) {
  const [err, user] = await requireAuth(request);
  if (err) return err;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const sort = (searchParams.get("sort") === "statusUpdated" ? "statusUpdated" : "applied") as ApplicationSort;
  const filters = {
    ...(status && isValidStatus(status) ? { status } : {}),
    sort,
  };
  const applications = await getApplications(user!.id, filters);
  return NextResponse.json(
    applications.map((a) => ({
      id: a.id,
      company: a.company,
      role: a.role,
      status: a.status,
      appliedAt: a.appliedAt.toISOString(),
      statusUpdatedAt: a.statusUpdatedAt?.toISOString() ?? null,
      notes: a.notes,
      jobUrl: a.jobUrl,
      nextStepOrDeadline: a.nextStepOrDeadline,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }))
  );
}

export async function POST(request: Request) {
  const [err, user] = await requireAuth(request);
  if (err) return err;

  const body = await request.json().catch(() => ({}));
  const company = typeof body.company === "string" ? body.company.trim() : "";
  const role = typeof body.role === "string" ? body.role.trim() : "";
  const status = typeof body.status === "string" ? body.status : "";
  const appliedAtStr = typeof body.appliedAt === "string" ? body.appliedAt : "";
  const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
  const jobUrl = typeof body.jobUrl === "string" ? body.jobUrl.trim() || null : null;
  const nextStepOrDeadline =
    typeof body.nextStepOrDeadline === "string" ? body.nextStepOrDeadline.trim() || null : null;

  if (!company) return NextResponse.json({ error: "Company is required" }, { status: 400 });
  if (!role) return NextResponse.json({ error: "Role is required" }, { status: 400 });
  if (!appliedAtStr) return NextResponse.json({ error: "appliedAt is required" }, { status: 400 });
  if (!status || !isValidStatus(status)) {
    return NextResponse.json(
      { error: `Status must be one of: ${APPLICATION_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }
  const appliedAt = new Date(appliedAtStr);
  if (Number.isNaN(appliedAt.getTime())) {
    return NextResponse.json({ error: "Invalid appliedAt date" }, { status: 400 });
  }

  try {
    const app = await createApplication(user!.id, {
      company,
      role,
      status,
      appliedAt,
      notes,
      jobUrl,
      nextStepOrDeadline,
    });
    return NextResponse.json({
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
    });
  } catch (e) {
    console.error("[API v1 applications POST]", e);
    return NextResponse.json({ error: "Failed to create application" }, { status: 500 });
  }
}
