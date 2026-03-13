import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureDefaultTagsForUser } from "@/lib/tags";
import { isProfessionId } from "@/lib/profession-config";
import { requireAuth } from "../require-auth";

export async function POST(request: Request) {
  const [err, user] = await requireAuth(request);
  if (err) return err;

  const body = await request.json().catch(() => ({}));
  const professionId = typeof body.professionId === "string" ? body.professionId.trim() : "";

  if (!professionId || !isProfessionId(professionId)) {
    return NextResponse.json(
      { error: "Valid professionId is required" },
      { status: 400 }
    );
  }

  try {
    await prisma.user.update({
      where: { id: user!.id },
      data: { profession: professionId },
    });
    await ensureDefaultTagsForUser(user!.id, professionId);
  } catch (e) {
    console.error("[API v1 onboarding]", e);
    return NextResponse.json(
      { error: "Failed to set track" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
