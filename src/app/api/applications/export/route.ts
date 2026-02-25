import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getApplications } from "@/lib/applications";

function escapeCsvField(value: string | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const applications = await getApplications(session.user.id, { sort: "applied" });
  const headers = [
    "Company",
    "Role",
    "Status",
    "Date Applied",
    "Status Updated",
    "Job URL",
    "Next Step / Deadline",
    "Notes",
  ];
  const rows = applications.map((app) => [
    escapeCsvField(app.company),
    escapeCsvField(app.role),
    escapeCsvField(app.status),
    escapeCsvField(app.appliedAt.toISOString().slice(0, 10)),
    escapeCsvField(
      app.statusUpdatedAt ? app.statusUpdatedAt.toISOString().slice(0, 10) : ""
    ),
    escapeCsvField(app.jobUrl ?? ""),
    escapeCsvField(app.nextStepOrDeadline ?? ""),
    escapeCsvField(app.notes ?? ""),
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="applications-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
