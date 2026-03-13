import { NextResponse } from "next/server";
import { getAllTags, createTag } from "@/lib/tags";
import { requireAuth } from "../require-auth";

export async function GET(request: Request) {
  const [err, user] = await requireAuth(request);
  if (err) return err;
  const tags = await getAllTags(user!.id);
  return NextResponse.json(
    tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug }))
  );
}

export async function POST(request: Request) {
  const [err, user] = await requireAuth(request);
  if (err) return err;

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const tag = await createTag(user!.id, name);
    return NextResponse.json({ id: tag.id, name: tag.name, slug: tag.slug });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create tag";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
