import type { ProfessionId } from "@/lib/profession-config";
import { getDefaultTagsForProfession } from "@/lib/profession-config";
import { prisma } from "./db";

export async function getAllTags(userId: string) {
  return prisma.tag.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}

export async function createTag(userId: string, name: string) {
  const slug = slugFromName(name);
  if (!slug) throw new Error("Invalid tag name");
  const existing = await prisma.tag.findUnique({
    where: { userId_slug: { userId, slug } },
  });
  if (existing) throw new Error("Tag already exists");
  return prisma.tag.create({ data: { userId, name: name.trim(), slug } });
}

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export async function updateTag(userId: string, id: string, name: string) {
  const tag = await prisma.tag.findFirst({ where: { id, userId } });
  if (!tag) throw new Error("Tag not found");
  const slug = slugFromName(name);
  if (!slug) throw new Error("Invalid tag name");
  const existing = await prisma.tag.findUnique({
    where: { userId_slug: { userId, slug } },
  });
  if (existing && existing.id !== id) throw new Error("A tag with that name already exists");
  return prisma.tag.update({
    where: { id },
    data: { name: name.trim(), slug },
  });
}

export async function deleteTag(userId: string, id: string) {
  const tag = await prisma.tag.findFirst({ where: { id, userId } });
  if (!tag) throw new Error("Tag not found");
  await prisma.taskTag.deleteMany({ where: { tagId: id } });
  return prisma.tag.delete({ where: { id } });
}

/**
 * Ensure the default tags for the given profession exist for the user (upsert by slug).
 * Does not remove existing tags; only adds missing defaults.
 */
export async function ensureDefaultTagsForUser(
  userId: string,
  professionId: ProfessionId
): Promise<void> {
  const defaults = getDefaultTagsForProfession(professionId);
  for (const { name, slug } of defaults) {
    await prisma.tag.upsert({
      where: { userId_slug: { userId, slug } },
      update: {},
      create: { userId, name, slug },
    });
  }
}
