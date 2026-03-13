import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureDefaultTagsForUser } from "@/lib/tags";
import { isProfessionId } from "@/lib/profession-config";
import { requireAuth } from "../require-auth";

export async function GET(request: Request) {
  const [err, user] = await requireAuth(request);
  if (err) return err;
  return NextResponse.json({
    id: user!.id,
    email: user!.email,
    name: user!.name,
    profession: user!.profession,
  });
}

export async function PATCH(request: Request) {
  const [err, user] = await requireAuth(request);
  if (err) return err;

  const body = await request.json().catch(() => ({}));
  const profession = typeof body.profession === "string" ? body.profession.trim() : undefined;
  const reminderEnabled =
    typeof body.reminderEnabled === "boolean" ? body.reminderEnabled : undefined;
  const reminderTime =
    typeof body.reminderTime === "string" ? body.reminderTime.trim() || null : undefined;

  const data: { profession?: string | null; reminderEnabled?: boolean; reminderTime?: string | null } = {};
  if (profession !== undefined) {
    if (profession !== "" && !isProfessionId(profession)) {
      return NextResponse.json({ error: "Invalid profession" }, { status: 400 });
    }
    data.profession = profession === "" ? null : profession;
  }
  if (reminderEnabled !== undefined) data.reminderEnabled = reminderEnabled;
  if (reminderTime !== undefined) data.reminderTime = reminderTime;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true });
  }

  try {
    await prisma.user.update({
      where: { id: user!.id },
      data,
    });
    if (data.profession && data.profession !== "") {
      await ensureDefaultTagsForUser(user!.id, data.profession).catch(() => {});
    }
  } catch (e) {
    console.error("[API v1 me PATCH]", e);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
