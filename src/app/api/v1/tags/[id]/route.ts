import { NextResponse } from "next/server";
import { updateTag, deleteTag } from "@/lib/tags";
import { requireAuth } from "../../require-auth";

type Params = Promise<{ id: string }>;

export async function PATCH(
  request: Request,
  { params }: { params: Params }
) {
  const [err, user] = await requireAuth(request);
  if (err) return err;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  try {
    const tag = await updateTag(user!.id, id, name);
    return NextResponse.json({ id: tag.id, name: tag.name, slug: tag.slug });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update tag";
    return NextResponse.json({ error: msg }, { status: 400 });
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
    await deleteTag(user!.id, id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }
}
